from rest_framework import serializers
from .models import (
    ProductTemplate,
    TemplateField,
    Product,
    ProductFieldValue,
    ProductCategory,
    TemplateUpload,
    Order,
    OrderFieldPosition,
    OrderFormTemplate,
    OrderFormField
)


class TemplateFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = TemplateField
        fields = [
            'id', 'label', 'type', 'required', 'options',
            'currency_symbol', 'decimal_places', 'order'
        ]
        extra_kwargs = {
            'options': {'required': False},
            'currency_symbol': {'required': False},
            'decimal_places': {'required': False},
            'order': {'required': False}
        }

    def update(self, instance, validated_data):
        if instance.type == "currency" and "currency_symbol" in validated_data:
            if instance.currency_symbol != validated_data["currency_symbol"]:
                raise serializers.ValidationError({
                    "currency_symbol": "Currency symbol cannot be changed once set."
                })
        return super().update(instance, validated_data)


class ProductTemplateSerializer(serializers.ModelSerializer):
    fields = TemplateFieldSerializer(many=True)

    class Meta:
        model = ProductTemplate
        fields = [
            'id', 'name', 'status', 'business', 'fields', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def create(self, validated_data):
        fields_data = validated_data.pop('fields', [])
        template = ProductTemplate.objects.create(**validated_data)
        for field_data in fields_data:
            TemplateField.objects.create(template=template, **field_data)
        return template

    def update(self, instance, validated_data):
        fields_data = validated_data.pop('fields', [])

        if not isinstance(fields_data, list):
            raise serializers.ValidationError({"fields": "Invalid format: fields must be a list"})

        # Create mappings for existing fields
        existing_fields_by_id = {field.id: field for field in instance.fields.all()}
        existing_fields_by_label_type = {
            (field.label.strip().lower(), field.type): field 
            for field in instance.fields.all()
        }
        processed_field_ids = set()

        for field_data in fields_data:
            field_id = field_data.get('id')
            matched_field = None

            # First try to match by ID if provided
            if field_id and field_id in existing_fields_by_id:
                matched_field = existing_fields_by_id[field_id]
            
            # Fallback to matching by label and type if no ID or not found by ID
            elif not field_id or field_id not in existing_fields_by_id:
                label = field_data.get('label', '').strip().lower()
                field_type = field_data.get('type')
                matched_field = existing_fields_by_label_type.get((label, field_type))

            # If we found a match, update it
            if matched_field:
                # Special handling for currency fields
                if matched_field.type == "currency":
                    new_symbol = field_data.get("currency_symbol")
                    if new_symbol and new_symbol != matched_field.currency_symbol:
                        raise serializers.ValidationError({
                            "currency_symbol": f"Currency symbol is locked as '{matched_field.currency_symbol}'."
                        })

                # Update all other attributes
                for attr, value in field_data.items():
                    if attr != 'id':  # Don't allow changing the ID
                        setattr(matched_field, attr, value)
                matched_field.save()
                processed_field_ids.add(matched_field.id)
            
            # No match found - create new field
            else:
                new_field = TemplateField.objects.create(template=instance, **field_data)
                processed_field_ids.add(new_field.id)

        # Delete fields that weren't included in the update (optional)
        fields_to_delete = instance.fields.exclude(id__in=processed_field_ids)
        if fields_to_delete.exists():
            fields_to_delete.delete()

        # Update template-level attributes
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        return instance


class ProductCategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = ProductCategory
        fields = ['id', 'name', 'parent', 'business', 'children']
        extra_kwargs = {
            'parent': {'required': False, 'allow_null': True},
            'business': {'required': False, 'read_only': True}
        }

    def get_children(self, obj):
        return ProductCategorySerializer(obj.children.all(), many=True).data

    def validate_parent(self, value):
        if value and value.business != self.context['request'].user.businesses.first():
            raise serializers.ValidationError("Parent category must belong to your business")
        return value

    def create(self, validated_data):
        validated_data.pop('business', None)
        business = self.context['request'].user.businesses.first()
        if not business:
            raise serializers.ValidationError("User has no associated business")
        return ProductCategory.objects.create(business=business, **validated_data)

    def update(self, instance, validated_data):
        if 'business' in validated_data:
            validated_data.pop('business')
        parent = validated_data.get('parent')
        if parent and parent.id == instance.id:
            raise serializers.ValidationError("A category cannot be its own parent")
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class ProductFieldValueSerializer(serializers.ModelSerializer):
    field = TemplateFieldSerializer(read_only=True)
    field_id = serializers.PrimaryKeyRelatedField(
        queryset=TemplateField.objects.all(),
        source='field',
        write_only=True
    )

    class Meta:
        model = ProductFieldValue
        fields = ['id', 'field', 'field_id', 'value']
        extra_kwargs = {'value': {'required': False, 'allow_blank': True}}


class ProductSerializer(serializers.ModelSerializer):
    field_values = ProductFieldValueSerializer(many=True, required=False)
    template = ProductTemplateSerializer(read_only=True)
    template_id = serializers.PrimaryKeyRelatedField(
        queryset=ProductTemplate.objects.all(),
        source='template',
        write_only=True
    )
    category = ProductCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=ProductCategory.objects.all(),
        source='category',
        write_only=True,
        allow_null=True,
        required=False
    )
    image = serializers.ImageField(required=False, allow_null=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'custom_id', 'template', 'template_id',
            'category', 'category_id', 'business', 'field_values',
            'image', 'image_url', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'business']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        elif obj.image:
            return f'/media/{obj.image}'
        return None

    def validate_field_values(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Field values must be a list.")
        return value

    def create(self, validated_data):
        raw_field_values = self.initial_data.get('field_values', [])
        if isinstance(raw_field_values, str):
            import json
            raw_field_values = json.loads(raw_field_values)

        # Validate with nested serializer
        field_serializer = ProductFieldValueSerializer(data=raw_field_values, many=True)
        field_serializer.is_valid(raise_exception=True)
        validated_field_values = field_serializer.validated_data

        template = validated_data['template']
        user = self.context['request'].user

        if template.business.manufacturer != user:
            raise serializers.ValidationError("You don't have permission to use this template.")

        product = Product.objects.create(business=template.business, **validated_data)

        for value in validated_field_values:
            ProductFieldValue.objects.create(
                product=product,
                field=value['field'],
                value=value['value']
            )

        return product

    def update(self, instance, validated_data):
        raw_field_values = self.initial_data.get('field_values', [])
        if isinstance(raw_field_values, str):
            import json
            raw_field_values = json.loads(raw_field_values)

        field_serializer = ProductFieldValueSerializer(data=raw_field_values, many=True)
        field_serializer.is_valid(raise_exception=True)
        validated_field_values = field_serializer.validated_data

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        existing_values = {fv.field.id: fv for fv in instance.field_values.all()}
        updated_field_ids = set()

        for value in validated_field_values:
            field = value['field']
            updated_field_ids.add(field.id)
            if field.id in existing_values:
                fv = existing_values[field.id]
                fv.value = value['value']
                fv.save()
            else:
                ProductFieldValue.objects.create(
                    product=instance,
                    field=field,
                    value=value['value']
                )

        return instance


class TemplateUploadSerializer(serializers.ModelSerializer):
    preview_image_url = serializers.SerializerMethodField()

    class Meta:
        model = TemplateUpload
        fields = [
            'id',
            'file',
            'template_type',
            'uploaded_at',
            'field_mappings',
            'preview_image',
            'preview_image_url',
            'preview_dpi',
            'pdf_width_pt',
            'pdf_height_pt',
        ]
        read_only_fields = ['uploaded_at', 'preview_image', 'preview_dpi', 'pdf_width_pt', 'pdf_height_pt']

    def get_preview_image_url(self, obj):
        request = self.context.get('request')
        if obj.preview_image and request:
            return request.build_absolute_uri(obj.preview_image.url)
        elif obj.preview_image:
            return f"/media/{obj.preview_image}"
        return None


class OrderFormFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderFormField
        fields = [
            'id',
            'template',
            'label',
            'key',
            'type',
            'required',
            'description',
            'order',
        ]
        read_only_fields = ['key']


class OrderFormTemplateSerializer(serializers.ModelSerializer):
    fields = OrderFormFieldSerializer(many=True, read_only=True)

    class Meta:
        model = OrderFormTemplate
        fields = ['id', 'business', 'name', 'created_at', 'fields']

    def create(self, validated_data):
        return OrderFormTemplate.objects.create(**validated_data)


class OrderFieldPositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderFieldPosition
        fields = [
            'id', 'x', 'y', 'page',
            'field_key', 'template_upload', 'order_form_template',
        ]


class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['id', 'order_number', 'template_type', 'data', 'status', 'created_at']
        read_only_fields = ['status', 'created_at']

    def create(self, validated_data):
        user = self.context['request'].user
        if not hasattr(user, 'business') or not user.business:
            raise serializers.ValidationError("Customer is not linked to a business")

        return Order.objects.create(
            customer=user,
            business=user.business,
            template_type=validated_data.get('template_type', 'order'),
            data=validated_data.get('data', {}),
            placed_by='middleman'
        )