from rest_framework import viewsets, generics, status
from rest_framework.views import APIView
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import get_user_model
import json
import os
from io import BytesIO
from django.http import FileResponse
from rest_framework.decorators import api_view, permission_classes
import traceback

from .models import (
    ProductTemplate, 
    Product, 
    ProductCategory, 
    TemplateUpload, 
    OrderFieldPosition, 
    Order, 
    OrderNumberConfig, 
    Business,
    OrderFormTemplate,
    OrderFormField
)
from .serializers import (
    ProductTemplateSerializer,
    ProductSerializer,
    ProductCategorySerializer,
    TemplateUploadSerializer,
    OrderSerializer,
    OrderFieldPositionSerializer,
    OrderFormTemplateSerializer,
    OrderFormFieldSerializer
)

from pdf2image import convert_from_path
from PIL import Image, ImageDraw, ImageFont
from django.core.files.base import ContentFile
from authapp.models import User

User = get_user_model()


class ProductCategoryViewSet(viewsets.ModelViewSet):
    queryset = ProductCategory.objects.all()
    serializer_class = ProductCategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        business_id = self.request.query_params.get('business')
        user = self.request.user
        queryset = self.queryset.filter(business__manufacturer=user)
        if business_id:
            queryset = queryset.filter(business_id=business_id)
        return queryset.select_related('parent', 'business')

    def perform_create(self, serializer):
        business = self.request.user.businesses.first()
        if not business:
            raise ValidationError("User has no associated business")
        serializer.save(business=business)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()

        if instance.business.manufacturer != request.user:
            return Response({"detail": "Unauthorized: You do not own this business."}, 
                           status=status.HTTP_401_UNAUTHORIZED)

        partial = kwargs.pop('partial', False)

        if 'business' in request.data:
            request.data.pop('business')

        parent_id = request.data.get('parent')
        if parent_id and parent_id == instance.id:
            return Response(
                {"detail": "A category cannot be its own parent"},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)


class ProductTemplateViewSet(viewsets.ModelViewSet):
    queryset = ProductTemplate.objects.all()
    serializer_class = ProductTemplateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        business_id = self.request.query_params.get('business')
        qs = self.queryset.filter(business__manufacturer=self.request.user)
        if business_id:
            qs = qs.filter(business_id=business_id)
        return qs


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        business_id = self.request.query_params.get('business')
        qs = self.queryset.filter(business__manufacturer=self.request.user)
        if business_id:
            qs = qs.filter(business_id=business_id)
        return qs

    def get_serializer(self, *args, **kwargs):
        if self.request.method in ['POST', 'PUT', 'PATCH']:
            data = self.request.data.copy()
            if isinstance(data.get('field_values'), str):
                try:
                    data['field_values'] = json.loads(data['field_values'])
                except json.JSONDecodeError:
                    raise ValidationError({"field_values": "Invalid JSON format"})
            kwargs['data'] = data
        return super().get_serializer(*args, **kwargs)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

    def perform_create(self, serializer):
        image = self.request.FILES.get('image')
        serializer.save(image=image)

    def perform_update(self, serializer):
        instance = self.get_object()
        old_image = instance.image.path if instance.image else None
        serializer.save()
        instance = Product.objects.prefetch_related("field_values__field").get(pk=serializer.instance.pk)


        new_image = self.request.FILES.get('image')
        if new_image:
            instance.image = new_image
            instance.save()
            if old_image and os.path.exists(old_image):
                os.remove(old_image)


class OrderFormTemplateViewSet(viewsets.ModelViewSet):
    queryset = OrderFormTemplate.objects.prefetch_related('fields').all()
    serializer_class = OrderFormTemplateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = self.queryset.filter(business__manufacturer=self.request.user)
        print(f"OrderFormTemplate queryset: {queryset.count()} templates found for user {self.request.user.id}")
        return queryset

    def list(self, request, *args, **kwargs):
        print(f"OrderFormTemplate list called by user {request.user.id}")
        response = super().list(request, *args, **kwargs)
        print(f"OrderFormTemplate list response: {response.data}")
        
        # Debug: Show all templates regardless of user
        all_templates = OrderFormTemplate.objects.prefetch_related('fields').all()
        print(f"All templates in DB: {all_templates.count()}")
        for template in all_templates:
            print(f"Template {template.id}: business={template.business_id}, manufacturer={template.business.manufacturer_id}, fields={template.fields.count()}")
        
        return response

    def create(self, request, *args, **kwargs):
        business_id = request.data.get('business')

        if not business_id:
            return Response({"detail": "Business ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if a template already exists for this business
        existing_template = OrderFormTemplate.objects.filter(business_id=business_id).first()

        if existing_template:
            return Response(
                {"detail": "An order form template already exists for this business.", "template_id": existing_template.id},
                status=status.HTTP_400_BAD_REQUEST
            )

        return super().create(request, *args, **kwargs)


class OrderFormFieldViewSet(viewsets.ModelViewSet):
    queryset = OrderFormField.objects.all()
    serializer_class = OrderFormFieldSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(template__business__manufacturer=self.request.user)

    def clear(self, request, template_id=None):
        """Clear all fields for a specific template"""
        try:
            template = OrderFormTemplate.objects.get(
                id=template_id,
                business__manufacturer=request.user
            )
            template.fields.all().delete()
            # --- Orphaned OrderFieldPosition cleanup ---
            from .models import OrderFieldPosition
            # Get new field keys from request if available
            new_field_keys = [f["label"].strip().lower().replace(" ", "_") for f in request.data.get("fields", [])] if request.data.get("fields") else []
            if new_field_keys:
                OrderFieldPosition.objects.filter(order_form_template=template).exclude(field_key__in=new_field_keys).delete()
            # --- End cleanup ---
            return Response({"detail": "All fields cleared successfully"}, status=status.HTTP_200_OK)
        except OrderFormTemplate.DoesNotExist:
            return Response({"detail": "Template not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"detail": "Failed to clear fields"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class OrderFieldPositionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, template_id, position_id=None):
        if position_id:
            position = get_object_or_404(OrderFieldPosition, id=position_id, template_upload_id=template_id)
            serializer = OrderFieldPositionSerializer(position)
            return Response(serializer.data)
        else:
            positions = OrderFieldPosition.objects.filter(template_upload_id=template_id)
            serializer = OrderFieldPositionSerializer(positions, many=True)
            return Response(serializer.data)

    def post(self, request, template_id):
        try:
            data = request.data.copy()
            data['template_upload'] = template_id

            template = TemplateUpload.objects.get(id=template_id)
            user = request.user

            # ✅ Try getting business from uploader or user
            business = getattr(template.uploaded_by, 'business', None) or getattr(user, 'business', None)

            # 🔁 Fallback: look up order_form_template by template type
            form_template = None
            if business:
                form_template = OrderFormTemplate.objects.filter(business=business).first()
            if not form_template:
                # Try by name (template_type) if above fails
                form_template = OrderFormTemplate.objects.filter(
                    name__icontains=template.template_type
                ).first()

            if not form_template:
                return Response({'detail': 'No OrderFormTemplate found for this business or template type.'}, status=400)

            data['order_form_template'] = form_template.id

            serializer = OrderFieldPositionSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=201)
            else:
                return Response(serializer.errors, status=400)

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'detail': str(e)}, status=500)

    def put(self, request, template_id, position_id):
        try:
            position = get_object_or_404(OrderFieldPosition, id=position_id, template_upload_id=template_id)

            # ✅ partial=True allows only sending x/y/page
            serializer = OrderFieldPositionSerializer(position, data=request.data, partial=True)

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            else:
                print("❌ Validation errors on PUT:", serializer.errors)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            print("❌ EXCEPTION during PUT update:")
            traceback.print_exc()  # ✅ Print full error to terminal
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, template_id, position_id):
        try:
            position = get_object_or_404(OrderFieldPosition, id=position_id, template_upload_id=template_id)
            position.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CustomerStatusCheckView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user.is_authenticated or not getattr(user, 'is_approved', False):
            return Response({"detail": "Access pending approval."}, status=403)
        return Response({"detail": "Approved", "is_approved": True}, status=200)


class CustomerProductListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.role != "customer" or not user.business:
            return Response({"detail": "You are not authorized or not linked to any business."}, 
                          status=403)

        products = Product.objects.filter(business=user.business)
        serializer = ProductSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)

class TemplateUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request, template_id=None):
        user = request.user

        if template_id:
            try:
                template = TemplateUpload.objects.get(id=template_id)

                # ✅ Check if user has access
                if user.role == "manufacturer" and template.uploaded_by == user:
                    pass
                elif user.role == "customer" and user.business and user.business.manufacturer == template.uploaded_by:
                    pass
                else:
                    return Response({"detail": "Not authorized to access this template."}, status=403)

                serializer = TemplateUploadSerializer(template, context={"request": request})
                return Response(serializer.data)

            except TemplateUpload.DoesNotExist:
                return Response({"detail": "Template not found."}, status=404)

        # Default: return all visible templates
        if user.role == "manufacturer":
            templates = TemplateUpload.objects.filter(uploaded_by=user)
        elif user.role == "customer" and user.business and user.business.manufacturer:
            templates = TemplateUpload.objects.filter(uploaded_by=user.business.manufacturer)
        else:
            return Response({"detail": "Unsupported role."}, status=403)

        serializer = TemplateUploadSerializer(templates, many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request):
        if request.user.role != "manufacturer":
            return Response({"detail": "Only manufacturers can upload templates."}, 
                            status=status.HTTP_403_FORBIDDEN)

        template_type = request.data.get('template_type')
        file = request.FILES.get('file')
        field_mappings = request.data.get('field_mappings')

        if not template_type or not file:
            return Response({"detail": "Missing template_type or file."}, 
                            status=status.HTTP_400_BAD_REQUEST)

        if isinstance(field_mappings, str):
            try:
                field_mappings = json.loads(field_mappings)
            except json.JSONDecodeError:
                return Response({"detail": "Invalid JSON format for field_mappings"}, 
                                status=status.HTTP_400_BAD_REQUEST)

        # Replace existing template of the same type for the same user
        TemplateUpload.objects.filter(
            uploaded_by=request.user,
            template_type=template_type
        ).delete()

        upload = TemplateUpload.objects.create(
            uploaded_by=request.user,
            template_type=template_type,
            file=file,
            field_mappings=field_mappings or {}
        )

        # Generate preview image if it's a PDF
        if file.name.lower().endswith('.pdf'):
            self._generate_pdf_preview_image(upload)

        serializer = TemplateUploadSerializer(upload, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def _generate_pdf_preview_image(self, template_obj):
        try:
            pdf_path = template_obj.file.path
            output_folder = os.path.join("media", "templates", "previews")
            os.makedirs(output_folder, exist_ok=True)

            preview_dpi = 72  # Align with PDF point units
            
            # Try without poppler path first
            try:
                pages = convert_from_path(
                    pdf_path,
                    dpi=preview_dpi,
                    first_page=1,
                    last_page=1
                )
            except Exception as e:
                print(f"[WARNING] PDF conversion failed without poppler: {str(e)}")
                # Try with common poppler paths
                poppler_paths = [
                    r"C:\poppler-24.08.0\Library\bin",
                    r"C:\poppler\bin",
                    r"C:\Program Files\poppler\bin",
                    "/usr/bin",
                    "/usr/local/bin"
                ]
                
                pages = None
                for poppler_path in poppler_paths:
                    try:
                        if os.path.exists(poppler_path):
                            pages = convert_from_path(
                                pdf_path,
                                dpi=preview_dpi,
                                first_page=1,
                                last_page=1,
                                poppler_path=poppler_path
                            )
                            break
                    except Exception:
                        continue
                
                if not pages:
                    print(f"[ERROR] Could not convert PDF with any poppler path")
                    # Create a placeholder image
                    try:
                        # Create a simple placeholder image
                        img = Image.new('RGB', (800, 600), color='white')
                        draw = ImageDraw.Draw(img)
                        
                        # Try to use a default font, fallback to basic if not available
                        try:
                            font = ImageFont.truetype("arial.ttf", 24)
                        except:
                            font = ImageFont.load_default()
                        
                        # Draw placeholder text
                        text = f"PDF Template Preview\n{template_obj.file.name}"
                        bbox = draw.textbbox((0, 0), text, font=font)
                        text_width = bbox[2] - bbox[0]
                        text_height = bbox[3] - bbox[1]
                        
                        x = (800 - text_width) // 2
                        y = (600 - text_height) // 2
                        
                        draw.text((x, y), text, fill='gray', font=font)
                        
                        # Save the placeholder
                        buffer = BytesIO()
                        img.save(buffer, format='PNG')
                        buffer.seek(0)
                        
                        filename = f"preview_{template_obj.id}.png"
                        template_obj.preview_image.save(filename, ContentFile(buffer.read()), save=True)
                        
                        # Set default PDF dimensions
                        template_obj.preview_dpi = 72
                        template_obj.pdf_width_pt = 595.0  # A4 width
                        template_obj.pdf_height_pt = 842.0  # A4 height
                        template_obj.save()
                        
                        print(f"[INFO] Created placeholder image for template {template_obj.id}")
                        return
                        
                    except Exception as placeholder_error:
                        print(f"[ERROR] Could not create placeholder image: {str(placeholder_error)}")
                        return

            if pages:
                image = pages[0]
                buffer = BytesIO()
                image.save(buffer, format='PNG')
                buffer.seek(0)

                filename = f"preview_{template_obj.id}.png"
                template_obj.preview_image.save(filename, ContentFile(buffer.read()), save=True)

                # Get PDF page size in points (1pt = 1/72 inch)
                # Use PyPDF2 to get the page size
                try:
                    from PyPDF2 import PdfReader
                    reader = PdfReader(pdf_path)
                    page = reader.pages[0]
                    media_box = page.mediabox
                    pdf_width_pt = float(media_box.width)
                    pdf_height_pt = float(media_box.height)
                except Exception as e:
                    print(f"[ERROR] Could not extract PDF page size: {str(e)}")
                    pdf_width_pt = None
                    pdf_height_pt = None

                # Save DPI and page size to the template object
                template_obj.preview_dpi = 72
                template_obj.pdf_width_pt = pdf_width_pt
                template_obj.pdf_height_pt = pdf_height_pt
                template_obj.save()
                
                print(f"[SUCCESS] Preview image generated for template {template_obj.id}")

        except Exception as e:
            print(f"[ERROR] PDF preview generation failed: {str(e)}")
            # Don't fail the upload if preview generation fails
            pass

    def delete(self, request, template_id=None):
        user = request.user
        if not template_id:
            return Response({"detail": "Template ID required."}, status=400)
        try:
            template = TemplateUpload.objects.get(id=template_id)
            # Optional: check permissions
            if user.role == "manufacturer" and template.uploaded_by != user:
                return Response({"detail": "Not authorized to delete this template."}, status=403)
            # Delete files from disk
            if template.file and template.file.path and os.path.isfile(template.file.path):
                os.remove(template.file.path)
            if template.preview_image and template.preview_image.path and os.path.isfile(template.preview_image.path):
                os.remove(template.preview_image.path)
            template.delete()
            # Delete related OrderFieldPosition(s)
            order_form_templates = OrderFormTemplate.objects.filter(
                business=template.uploaded_by.business,
                name__icontains=template.template_type  # Adjust this as needed for your naming
            )
            OrderFieldPosition.objects.filter(order_form_template__in=order_form_templates).delete()
            return Response({"detail": "Template deleted successfully."}, status=204)
        except TemplateUpload.DoesNotExist:
            return Response({"detail": "Template not found."}, status=404)


class CustomerOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user.business:
            return Response({"detail": "Customer is not linked to any business"}, status=400)

        orders = Order.objects.filter(customer=user).order_by("-created_at")
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = OrderSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            order = serializer.save()
            return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CustomerOrderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, order_id):
        order = get_object_or_404(Order, id=order_id, customer=request.user)

        if order.status != "pending":
            return Response({"detail": "Only pending orders can be edited."}, status=400)

        serializer = OrderSerializer(order, data=request.data, partial=True, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=200)
        return Response(serializer.errors, status=400)

    def delete(self, request, order_id):
        order = get_object_or_404(Order, id=order_id, customer=request.user)
        
        if order.status != "pending":
            return Response(
                {"detail": "Only pending orders can be deleted."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class OrderNumberConfigView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user.business:
            return Response({"detail": "Business not found"}, status=400)

        config, created = OrderNumberConfig.objects.get_or_create(
            business=user.business,
            defaults={'start_number': 1, 'current_number': 1}
        )
        
        return Response({
            'start_number': config.start_number,
            'current_number': config.current_number,
            'prefix': config.prefix
        })

    def post(self, request):
        user = request.user
        if not user.business:
            return Response({"detail": "Business not found"}, status=400)

        start_number = request.data.get('start_number')
        prefix = request.data.get('prefix', '')

        if not start_number or not isinstance(start_number, int):
            return Response({"detail": "Invalid start number"}, status=400)

        config, created = OrderNumberConfig.objects.get_or_create(
            business=user.business
        )

        config.start_number = start_number
        config.current_number = start_number
        config.prefix = prefix
        config.save()

        return Response({
            'start_number': config.start_number,
            'current_number': config.current_number,
            'prefix': config.prefix
        })

class ManufacturerOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        business_id = request.query_params.get('business')
        
        if not business_id:
            return Response({"detail": "Business ID is required"}, status=400)

        try:
            business = Business.objects.get(id=business_id, manufacturer=user)
        except Business.DoesNotExist:
            return Response({"detail": "Business not found"}, status=404)

        orders = Order.objects.filter(business=business).order_by("-created_at")
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)

class ManufacturerOrderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, order_id):
        user = request.user
        try:
            order = Order.objects.get(id=order_id, business__manufacturer=user)
        except Order.DoesNotExist:
            return Response({"detail": "Order not found."}, status=404)

        status = request.data.get('status')
        if status and status in dict(Order.STATUS_CHOICES):
            order.status = status
            order.save()
            return Response({"detail": "Order status updated."})
        return Response({"detail": "Invalid status."}, status=400)

class CustomerOrderFormTemplateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        if user.role != "customer":
            return Response({"detail": "Only customers can access this endpoint."}, status=status.HTTP_403_FORBIDDEN)
        
        if not user.business:
            return Response({"detail": "Customer is not linked to any business."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Get the order form template for the customer's business
            template = OrderFormTemplate.objects.get(business=user.business)
            serializer = OrderFormTemplateSerializer(template)
            return Response(serializer.data)
        except OrderFormTemplate.DoesNotExist:
            return Response({"detail": "No order form template configured for this business."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"detail": "Failed to load order form template."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TemplateFileDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, template_id):
        try:
            template = TemplateUpload.objects.get(id=template_id)

            # Check if user is authorized to access this template
            if request.user.role == "manufacturer":
                if template.uploaded_by != request.user:
                    return Response({"detail": "Not authorized."}, status=403)
            elif request.user.role == "customer":
                if not request.user.business or request.user.business.manufacturer != template.uploaded_by:
                    return Response({"detail": "Not authorized."}, status=403)
            else:
                return Response({"detail": "Not authorized."}, status=403)

            return FileResponse(template.file.open("rb"), content_type="application/pdf")
        except TemplateUpload.DoesNotExist:
            return Response({"detail": "Template not found."}, status=404)

class ManufacturerBusinessListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        businesses = Business.objects.filter(manufacturer=user)
        data = [
            {
                "id": b.id,
                "name": b.name,
                "slogan": b.slogan,
                "shipping_country": b.shipping_country,
                "invite_code": b.invite_code,
            }
            for b in businesses
        ]
        return Response({"results": data})

class BusinessCustomerListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        business_id = request.query_params.get('business')
        if not business_id:
            return Response({"detail": "Business ID required"}, status=400)
        customers = User.objects.filter(business_id=business_id, role='customer')
        data = [
            {
                "id": c.id,
                "username": c.username,
                "first_name": c.first_name,
                "last_name": c.last_name,
                "name": c.get_full_name(),
                "email": c.email,
                "is_approved": c.is_approved,
                "rejected": c.rejected,
            }
            for c in customers
        ]
        return Response({"customers": data})

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def clear_order_form_fields(request, template_id):
    try:
        template = OrderFormTemplate.objects.get(id=template_id, business__manufacturer=request.user)
        template.fields.all().delete()
        return Response({"detail": "Order form fields cleared."}, status=status.HTTP_200_OK)
    except OrderFormTemplate.DoesNotExist:
        return Response({"detail": "Template not found."}, status=status.HTTP_404_NOT_FOUND)