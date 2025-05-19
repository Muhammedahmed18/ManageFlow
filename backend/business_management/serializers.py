from rest_framework import serializers
from .models import (
    ProductTemplate,
    TemplateField,
    Product,
    ProductFieldValue,
    ProductCategory,
    TemplateUpload,
    Order,
    OrderFieldPosition
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

        existing_fields = {field.id: field for field in instance.fields.all()}
        incoming_ids = set()

        for field_data in fields_data:
            field_id = field_data.get('id')
            if field_id and field_id in existing_fields:
                field = existing_fields[field_id]
                if field.type == "currency":
                    new_symbol = field_data.get("currency_symbol")
                    if new_symbol and new_symbol != field.currency_symbol:
                        raise serializers.ValidationError({
                            "currency_symbol": f"Currency symbol is locked as '{field.currency_symbol}'."
                        })
                for attr, value in field_data.items():
                    setattr(field, attr, value)
                field.save()
                incoming_ids.add(field.id)
            else:
                new_field = TemplateField.objects.create(template=instance, **field_data)
                incoming_ids.add(new_field.id)

        # ✅ Safe deletion of removed fields and only their values
        for field_id, field in existing_fields.items():
            if field_id not in incoming_ids:
                field.product_values.all().delete()
                field.delete()

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

        # Optionally remove any that were not re-submitted
        for field_id, fv in existing_values.items():
            if field_id not in updated_field_ids:
                fv.delete()

        return instance



class TemplateUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = TemplateUpload
        fields = [
            'id',
            'file',
            'template_type',
            'uploaded_at',
            'field_mappings',
            'preview_image',
        ]
        read_only_fields = ['uploaded_at', 'preview_image']


class OrderFieldPositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderFieldPosition
        fields = [
            'id', 'template', 'key', 'label',
            'x', 'y', 'page', 'font_size'
        ]


class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['id', 'template_type', 'data', 'status', 'created_at']
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