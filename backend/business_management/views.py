from rest_framework import viewsets, generics, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import get_user_model
import json
import os
from io import BytesIO

from .models import ProductTemplate, Product, ProductCategory, TemplateUpload, OrderFieldPosition
from .serializers import (
    ProductTemplateSerializer,
    ProductSerializer,
    ProductCategorySerializer,
    TemplateUploadSerializer,
    OrderSerializer,
    OrderFieldPositionSerializer
)

from pdf2image import convert_from_path
from PIL import Image
from django.core.files.base import ContentFile

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
        instance = serializer.save()
        image = self.request.FILES.get('image')
        if image:
            instance.image = image
            instance.save()

    def perform_update(self, serializer):
        instance = self.get_object()
        old_image = instance.image.path if instance.image else None
        instance = serializer.save()

        new_image = self.request.FILES.get('image')
        if new_image:
            instance.image = new_image
            instance.save()
            if old_image and os.path.exists(old_image):
                os.remove(old_image)


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


from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView

from .models import TemplateUpload
from .serializers import TemplateUploadSerializer

import json
import os

class TemplateUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request):
        user = request.user

        # ✅ Manufacturer sees their own uploads
        if user.role == "manufacturer":
            templates = TemplateUpload.objects.filter(uploaded_by=user)

        # ✅ Customer sees their manufacturer's uploads
        elif user.role == "customer":
            if not user.business or not user.business.manufacturer:
                return Response({"detail": "Customer is not linked to a manufacturer."}, status=400)

            manufacturer = user.business.manufacturer
            templates = TemplateUpload.objects.filter(uploaded_by=manufacturer)

        else:
            return Response({"detail": "Unsupported role."}, status=403)

        serializer = TemplateUploadSerializer(templates, many=True)
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

        serializer = TemplateUploadSerializer(upload)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def _generate_pdf_preview_image(self, template_obj):
        try:
            from pdf2image import convert_from_path
            from PIL import Image
            from io import BytesIO
            from django.core.files.base import ContentFile

            pdf_path = template_obj.file.path
            output_folder = os.path.join("media", "templates", "previews")
            os.makedirs(output_folder, exist_ok=True)

            poppler_path = r"C:\poppler-24.08.0\Library\bin"  # Use your actual path or remove if not needed

            pages = convert_from_path(
                pdf_path,
                dpi=150,
                first_page=1,
                last_page=1,
                poppler_path=poppler_path
            )

            if pages:
                image = pages[0]
                buffer = BytesIO()
                image.save(buffer, format='PNG')
                buffer.seek(0)

                filename = f"preview_{template_obj.id}.png"
                template_obj.preview_image.save(filename, ContentFile(buffer.read()), save=True)

        except Exception as e:
            print(f"[ERROR] PDF preview generation failed: {str(e)}")


class OrderFieldPositionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, template_id):
        user = request.user

        try:
            template = TemplateUpload.objects.get(id=template_id)
        except TemplateUpload.DoesNotExist:
            return Response({"detail": "Template not found."}, status=status.HTTP_404_NOT_FOUND)

        # ✅ Manufacturer can access their own templates
        if user == template.uploaded_by:
            pass

        # ✅ Customer can access templates from their linked manufacturer
        elif user.role == "customer":
            if not user.business or not user.business.manufacturer:
                return Response({"detail": "Customer not linked to a manufacturer."}, status=status.HTTP_403_FORBIDDEN)

            if user.business.manufacturer != template.uploaded_by:
                return Response({"detail": "Not authorized to access this template."}, status=status.HTTP_403_FORBIDDEN)

        else:
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)

        # ✅ If passed permission checks, return the placed fields
        positions = OrderFieldPosition.objects.filter(template=template)
        serializer = OrderFieldPositionSerializer(positions, many=True)
        return Response(serializer.data)

    def post(self, request, template_id):
        try:
            template = TemplateUpload.objects.get(id=template_id, uploaded_by=request.user)
        except TemplateUpload.DoesNotExist:
            return Response({"detail": "Template not found or unauthorized."}, 
                           status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()
        data['template'] = template.id

        serializer = OrderFieldPositionSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CustomerOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = OrderSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            order = serializer.save()
            return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)