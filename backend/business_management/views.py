"""
Business Management Views
========================

This module contains all the views for the business management system.
Views are organized by functionality: Product, Order, and Configuration views.
"""

import os
import json
from io import BytesIO
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.contrib.auth import get_user_model
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import ValidationError
from django.db.models import Q
from rest_framework.exceptions import PermissionDenied
from django.core.mail import send_mail

from .models import (
    ProductTemplate, 
    TemplateField, 
    ProductCategory, 
    Product, 
    ProductFieldValue,
    ProductCategory, 
 
    Order, 
    OrderStatusHistory,
    Business,
    Invoice,
    InvoiceItem,
    EndCustomer,
    NumberConfig,
    PredictionRecord,
    ProductConfidence,
    ManufacturerRequest,
    Proposal,
    ProposalResponse,
    ChatRoom,
    ChatMessage
)
from .serializers import (
    ProductTemplateSerializer,
    TemplateFieldSerializer,
    ProductSerializer,
    ProductCategorySerializer,

    OrderSerializer,

    BusinessSerializer,
    InvoiceSerializer,
    InvoiceCreateSerializer,
    EndCustomerSerializer,
    NumberConfigSerializer,
    ProposalSerializer,
    ProposalResponseSerializer,
    ChatRoomSerializer,
    ChatRoomDetailSerializer,
    ChatMessageSerializer
)

from authapp.models import User



User = get_user_model()


# =============================================================================
# PRODUCT VIEWS
# =============================================================================

class ProductCategoryViewSet(viewsets.ModelViewSet):
    """
    Product Category ViewSet
    ------------------------
    Handles CRUD operations for product categories with hierarchical structure.
    Supports parent-child relationships and business-specific filtering.
    """
    queryset = ProductCategory.objects.all()
    serializer_class = ProductCategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter categories by business and user permissions"""
        business_id = self.request.query_params.get('business')
        user = self.request.user
        queryset = self.queryset
        # Allow customers to see their business categories, manufacturers to see their businesses
        if user.role == 'customer':
            business = Business.objects.filter(owner=user).first()
            if business:
                queryset = queryset.filter(business=business)
            else:
                queryset = queryset.none()
        else:
            queryset = queryset.filter(business__manufacturer=user)
        if business_id:
            queryset = queryset.filter(business_id=business_id)
        return queryset.select_related('parent', 'business')

    def perform_create(self, serializer):
        """Create category with automatic business assignment"""
        business = Business.objects.filter(owner=self.request.user).first()
        if not business:
            raise ValidationError("User has no associated business")
        serializer.save(business=business)

    def update(self, request, *args, **kwargs):
        """Update category with validation for self-referencing"""
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

    def create(self, request, *args, **kwargs):
        if request.user.role != 'customer':
            return Response({'detail': 'Only customers can create categories.'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if request.user.role != 'customer':
            return Response({'detail': 'Only customers can update categories.'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        if request.user.role != 'customer':
            return Response({'detail': 'Only customers can update categories.'}, status=status.HTTP_403_FORBIDDEN)
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.role != 'customer':
            return Response({'detail': 'Only customers can delete categories.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class ProductTemplateViewSet(viewsets.ModelViewSet):
    """
    Product Template ViewSet
    ------------------------
    Handles CRUD operations for product templates with field management.
    """
    queryset = ProductTemplate.objects.all()
    serializer_class = ProductTemplateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter templates by business and user permissions"""
        business_id = self.request.query_params.get('business')
        user = self.request.user
        queryset = self.queryset
        # Allow customers to see their business templates, manufacturers to see their businesses
        if user.role == 'customer':
            business = Business.objects.filter(owner=user).first()
            if business:
                queryset = queryset.filter(business=business)
            else:
                queryset = queryset.none()
        else:
            queryset = queryset.filter(business__manufacturer=user)
        if business_id:
            queryset = queryset.filter(business_id=business_id)
        return queryset.select_related('business')


class TemplateFieldViewSet(viewsets.ModelViewSet):
    """
    Template Field ViewSet
    ----------------------
    Handles CRUD operations for template fields with business-specific filtering.
    """
    queryset = TemplateField.objects.all()
    serializer_class = TemplateFieldSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter fields by template and business permissions"""
        template_id = self.request.query_params.get('template')
        business_id = self.request.query_params.get('business')
        user = self.request.user
        queryset = self.queryset
        
        if template_id:
            queryset = queryset.filter(template_id=template_id)
        
        if business_id:
            queryset = queryset.filter(template__business_id=business_id)
        
        # Filter by user permissions
        if user.role == 'customer':
            business = Business.objects.filter(owner=user).first()
            if business:
                queryset = queryset.filter(template__business=business)
            else:
                queryset = queryset.none()
        else:
            queryset = queryset.filter(template__business__manufacturer=user)
        
        return queryset.select_related('template', 'template__business').order_by('order')

    def perform_create(self, serializer):
        """Create field with automatic template assignment"""
        template_id = self.request.data.get('template')
        if template_id:
            template = ProductTemplate.objects.get(id=template_id)
            serializer.save(template=template)
        else:
            serializer.save()

    def perform_update(self, serializer):
        """Update field with validation"""
        instance = serializer.instance
        template = instance.template
        
        # Check permissions
        if template.business.owner != self.request.user and template.business.manufacturer != self.request.user:
            raise ValidationError("You don't have permission to modify this field")
        
        serializer.save()

    def perform_destroy(self, instance):
        """Delete field with permission validation"""
        template = instance.template
        
        # Check permissions
        if template.business.owner != self.request.user and template.business.manufacturer != self.request.user:
            raise ValidationError("You don't have permission to delete this field")
        
        instance.delete()

    def create(self, request, *args, **kwargs):
        """Create field with role-based permission check"""
        if request.user.role not in ['customer', 'manufacturer']:
            return Response({"detail": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        """Update field with role-based permission check"""
        if request.user.role not in ['customer', 'manufacturer']:
            return Response({"detail": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        """Partial update field with role-based permission check"""
        if request.user.role not in ['customer', 'manufacturer']:
            return Response({"detail": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Delete field with role-based permission check"""
        if request.user.role not in ['customer', 'manufacturer']:
            return Response({"detail": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class ProductViewSet(viewsets.ModelViewSet):
    """
    Product ViewSet
    ---------------
    Handles CRUD operations for products with image upload and field value management.
    """
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        """Filter products by business and user permissions"""
        business_id = self.request.query_params.get('business')
        user = self.request.user
        qs = self.queryset
        
        # First, filter by the specific business_id
        if business_id:
            qs = qs.filter(business_id=business_id)
        else:
            return qs.none()  # No business_id provided, return empty
        
        # Then apply role-based permissions
        if user.role == 'customer':
            # Customer can only see products from their owned business
            customer_business = Business.objects.filter(owner=user).first()
            if customer_business and str(customer_business.id) == str(business_id):
                return qs  # Customer owns this business, allow access
            else:
                return qs.none()  # Customer doesn't own this business
        else:
            # Manufacturer can only see products from businesses where they are the manufacturer
            manufacturer_business = Business.objects.filter(manufacturer=user, id=business_id).first()
            if manufacturer_business:
                return qs  # Manufacturer is associated with this business
            else:
                return qs.none()  # Manufacturer not associated with this business

    def get_serializer(self, *args, **kwargs):
        """Handle JSON field values from form data"""
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
        """Add request context to serializer"""
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

    def perform_create(self, serializer):
        """Create product with image handling"""
        image = self.request.FILES.get('image')
        serializer.save(image=image)

    def perform_update(self, serializer):
        """Update product with image replacement"""
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

    def create(self, request, *args, **kwargs):
        if request.user.role != 'customer':
            return Response({'detail': 'Only customers can create products.'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if request.user.role != 'customer':
            return Response({'detail': 'Only customers can update products.'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        if request.user.role != 'customer':
            return Response({'detail': 'Only customers can update products.'}, status=status.HTTP_403_FORBIDDEN)
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.role != 'customer':
            return Response({'detail': 'Only customers can delete products.'}, status=status.HTTP_403_FORBIDDEN)
        instance = self.get_object()
        # Delete image file from disk if it exists
        if instance.image and instance.image.path and os.path.isfile(instance.image.path):
            try:
                os.remove(instance.image.path)
            except Exception as e:
                pass  # Optionally log the error
        return super().destroy(request, *args, **kwargs)


# =============================================================================
# ORDER VIEWS
# =============================================================================

class CustomerOrderView(APIView):
    """
    Customer Order View
    -------------------
    Handles customer order operations (list and create).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get customer's orders"""
        user = request.user
        business_id = request.query_params.get('business')
        
        if business_id:
            # Filter orders for specific business
            business = Business.objects.filter(id=business_id, owner=user).first()
            if not business:
                return Response({"detail": "Business not found or access denied"}, status=404)
            orders = Order.objects.filter(customer=user, business=business).select_related('business').order_by("-created_at")
        else:
            # Return all orders for customer across all their businesses
            orders = Order.objects.filter(customer=user).select_related('business').order_by("-created_at")
        
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Create new order"""
        serializer = OrderSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            order = serializer.save()
            return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CustomerOrderDetailView(APIView):
    """
    Customer Order Detail View
    --------------------------
    Handles individual customer order operations (update and delete).
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, order_id):
        """Update order (only pending orders)"""
        order = get_object_or_404(Order, id=order_id, customer=request.user)

        if order.status != "pending":
            return Response({"detail": "Only pending orders can be edited."}, status=400)

        serializer = OrderSerializer(order, data=request.data, partial=True, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=200)
        return Response(serializer.errors, status=400)

    def delete(self, request, order_id):
        """Delete order (only pending orders)"""
        order = get_object_or_404(Order, id=order_id, customer=request.user)
        
        if order.status != "pending":
            return Response(
                {"detail": "Only pending orders can be deleted."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CustomerOrderConfirmDeliveryView(APIView):
    """
    Customer Order Confirm Delivery View
    ------------------------------------
    Handles customer delivery confirmation for shipped orders.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        """Confirm delivery of a shipped order"""
        order = get_object_or_404(Order, id=order_id, customer=request.user)
        
        if order.status != "shipped":
            return Response(
                {"detail": "Only shipped orders can be confirmed for delivery."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update order status to delivered
        order.status = "delivered"
        order.save()
        
        # Create status history entry
        from .models import OrderStatusHistory
        OrderStatusHistory.objects.create(
            order=order,
            status="delivered",
            changed_by=request.user,
            notes="Delivery confirmed by customer"
        )
        
        return Response({"detail": "Delivery confirmed successfully."}, status=status.HTTP_200_OK)


class ManufacturerOrderView(APIView):
    """
    Manufacturer Order View
    -----------------------
    Handles manufacturer order listing and management.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get orders for manufacturer's businesses with filtering"""
        user = request.user
        if user.role != "manufacturer":
            return Response({"detail": "Only manufacturers can access this endpoint."}, status=403)

        # Get business ID from query params
        business_id = request.query_params.get('business')
        
        # Get all businesses where user is the manufacturer
        if business_id:
            businesses = Business.objects.filter(manufacturer=user, id=business_id)
        else:
            businesses = Business.objects.filter(manufacturer=user)
            
        if not businesses.exists():
            return Response({"detail": "No businesses found for this manufacturer."}, status=404)

        # Get all orders from these businesses
        orders = Order.objects.filter(business__in=businesses).select_related('business', 'customer').order_by("-created_at")
        
        # Apply status filter
        status_filter = request.query_params.get('status')
        if status_filter:
            if ',' in status_filter:
                # Multiple statuses
                statuses = status_filter.split(',')
                orders = orders.filter(status__in=statuses)
            else:
                # Single status
                orders = orders.filter(status=status_filter)
        
        # Apply no_invoice filter (exclude orders that already have invoices)
        no_invoice = request.query_params.get('no_invoice')
        if no_invoice and no_invoice.lower() == 'true':
            # Get orders that don't have invoices
            orders_with_invoices = Invoice.objects.filter(
                business__in=businesses
            ).values_list('order_id', flat=True).distinct()
            
            # Also exclude orders that are in related_orders of any invoice
            orders_in_related = Invoice.objects.filter(
                business__in=businesses
            ).values_list('related_orders', flat=True).distinct()
            
            all_invoiced_orders = set(orders_with_invoices) | set(orders_in_related)
            orders = orders.exclude(id__in=all_invoiced_orders)
        
        # Debug: Log order statuses
        print(f"ManufacturerOrderView: Found {orders.count()} orders for manufacturer {user.username}")
        for order in orders[:5]:  # Show first 5 orders
            print(f"  Order #{order.order_number}: status={order.status}, customer={order.customer.username}")
        
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)


class ManufacturerOrderDetailView(APIView):
    """
    Manufacturer Order Detail View
    ------------------------------
    Handles individual manufacturer order operations (status updates).
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, order_id):
        """Update order status (manufacturer only)"""
        user = request.user
        if user.role != "manufacturer":
            return Response({"detail": "Only manufacturers can update order status."}, status=403)

        order = get_object_or_404(Order, id=order_id, business__manufacturer=user)
        
        new_status = request.data.get('status')
        if not new_status:
            return Response({"detail": "Status is required."}, status=400)
        
        if new_status not in dict(Order.STATUS_CHOICES):
            return Response({"detail": "Invalid status."}, status=400)
        
        # Update order status
        order.status = new_status
        order.save()
        
        # Create status history entry
        from .models import OrderStatusHistory
        OrderStatusHistory.objects.create(
            order=order,
            status=new_status,
            changed_by=user,
            notes=request.data.get('notes', '')
        )
        
        serializer = OrderSerializer(order)
        return Response(serializer.data)


class CustomerProductListView(APIView):
    """
    Customer Product List View
    --------------------------
    Provides customers with access to their business's products.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get products for customer's business"""
        user = request.user
        if user.role != "customer":
            return Response({"detail": "Only customers can access this endpoint."}, status=403)

        business = Business.objects.filter(owner=user).first()
        if not business:
            return Response({"detail": "Customer is not linked to any business."}, status=404)

        products = Product.objects.filter(business=business).order_by("-created_at")
        serializer = ProductSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)


class ManufacturerBusinessListView(APIView):
    """
    Manufacturer Business List View
    -------------------------------
    Provides manufacturers with a list of their businesses.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get businesses for manufacturer with statistics"""
        user = request.user
        if user.role != "manufacturer":
            return Response({"detail": "Only manufacturers can access this endpoint."}, status=403)

        # Get all businesses where user has any relationship (approved, pending, or rejected)
        businesses = Business.objects.filter(
            Q(manufacturer=user) |  # Approved manufacturer
            Q(pending_manufacturers=user) |  # Pending manufacturer
            Q(rejected_manufacturers=user)   # Rejected manufacturer
        ).distinct()
        
        # Handle pagination
        page = int(request.query_params.get('page', 1))
        limit = int(request.query_params.get('limit', 10))
        
        # Calculate pagination
        total_count = businesses.count()
        start = (page - 1) * limit
        end = start + limit
        
        # Get paginated results
        paginated_businesses = businesses[start:end]
        
        # Calculate statistics for each business
        business_stats = {}
        for business in paginated_businesses:
            try:
                # Get orders for this business
                orders = Order.objects.filter(business=business)
                total_orders = orders.count()
                completed_orders = orders.filter(status='completed').count()
                
                # Calculate revenue from PAID manufacturer invoices (money manufacturer earned)
                invoices = Invoice.objects.filter(business=business)
                paid_invoices = invoices.filter(status='paid', invoice_type='manufacturer')
                
                total_revenue = sum(
                    float(invoice.total_amount or 0) 
                    for invoice in paid_invoices
                )
                
                # Debug logging for revenue calculation
                print(f"Business {business.name} manufacturer revenue calculation:")
                print(f"  - Total invoices: {invoices.count()}")
                print(f"  - Paid manufacturer invoices: {paid_invoices.count()}")
                print(f"  - Total revenue earned: ${total_revenue}")
                print(f"  - Paid invoice details: {[(inv.id, inv.total_amount, inv.status, inv.invoice_type) for inv in paid_invoices]}")
                
                # Get products count
                total_products = Product.objects.filter(business=business).count()
                
                # Get last order date
                last_order = orders.order_by('-created_at').first()
                last_order_date = last_order.created_at if last_order else None
                
                business_stats[business.id] = {
                    'total_orders': total_orders,
                    'completed_orders': completed_orders,
                    'total_revenue': total_revenue,
                    'total_products': total_products,
                    'last_order_date': last_order_date,
                    'order_completion_rate': (completed_orders / total_orders * 100) if total_orders > 0 else 0
                }
            except Exception as e:
                print(f"Error calculating stats for business {business.id}: {e}")
                business_stats[business.id] = {
                    'total_orders': 0,
                    'completed_orders': 0,
                    'total_revenue': 0,
                    'total_products': 0,
                    'last_order_date': None,
                    'order_completion_rate': 0
                }
        
        serializer = BusinessSerializer(paginated_businesses, many=True, context={'request': request})
        serialized_data = serializer.data
        
        # Add stats to each business
        for business_data in serialized_data:
            business_data['stats'] = business_stats.get(business_data['id'], {})
        
        return Response({
            'results': serialized_data,
            'count': total_count,
            'page': page,
            'limit': limit
        })


class BusinessViewSet(viewsets.ModelViewSet):
    queryset = Business.objects.all()
    serializer_class = BusinessSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter businesses by user permissions"""
        user = self.request.user
        if user.role == 'customer':
            return self.queryset.filter(owner=user)
        else:
            return self.queryset.filter(manufacturer=user)

    def retrieve(self, request, pk=None):
        """Get business details with additional information"""
        business = self.get_object()
        serializer = self.get_serializer(business)
        data = serializer.data
        
        # Add additional business information
        data['total_products'] = Product.objects.filter(business=business).count()
        data['total_orders'] = Order.objects.filter(business=business).count()
        
        return Response(data)

    def perform_create(self, serializer):
        """Create business with automatic user assignment and max_businesses validation"""
        user = self.request.user
        
        # Check max_businesses setting for customers
        if user.role == 'customer':
            try:
                from authapp.models import UserSettings
                settings, created = UserSettings.objects.get_or_create(user=user)
                current_business_count = Business.objects.filter(owner=user).count()
                
                if current_business_count >= settings.max_businesses:
                    raise serializers.ValidationError(
                        f"You have reached the maximum limit of {settings.max_businesses} businesses. "
                        "Please upgrade your plan or contact support to increase this limit."
                    )
                
                # Set default visibility from user settings
                serializer.validated_data['is_public'] = settings.default_visibility == 'public'
                print(f"DEBUG: User {user.username} default_visibility setting: {settings.default_visibility}, applied is_public: {serializer.validated_data['is_public']}")
                
                serializer.save(owner=user)
            except ImportError:
                # If UserSettings model is not available, proceed without validation
                serializer.save(owner=user)
        else:
            serializer.save(manufacturer=user)

    def update(self, request, *args, **kwargs):
        """Update business with permission validation"""
        instance = self.get_object()
        if instance.owner != request.user and instance.manufacturer != request.user:
            return Response({"detail": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Delete business with permission validation"""
        instance = self.get_object()
        if instance.owner != request.user and instance.manufacturer != request.user:
            return Response({"detail": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class BusinessCustomerListView(APIView):
    """
    Business Customer List View
    ---------------------------
    Provides manufacturers with a list of customers for their businesses.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get customers for manufacturer's businesses"""
        user = request.user
        if user.role != "manufacturer":
            return Response({"detail": "Only manufacturers can access this endpoint."}, status=403)

        businesses = Business.objects.filter(manufacturer=user)
        customers = []
        
        for business in businesses:
            if business.owner:
                customers.append({
                    'business_id': business.id,
                    'business_name': business.name,
                    'customer_id': business.owner.id,
                    'customer_name': business.owner.username,
                    'customer_email': business.owner.email,
                    'customer_first_name': business.owner.first_name,
                    'customer_last_name': business.owner.last_name,
                })
        
        return Response(customers)


class BusinessManufacturerListView(APIView):
    """
    Returns invite_code, approved manufacturer, and pending manufacturers for a business.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get business manufacturer information"""
        user = request.user
        if user.role != "manufacturer":
            return Response({"detail": "Only manufacturers can access this endpoint."}, status=403)

        businesses = Business.objects.filter(manufacturer=user)
        result = []
        
        for business in businesses:
            business_data = {
                'business_id': business.id,
                'business_name': business.name,
                'invite_code': business.invite_code,
                'approved_manufacturer': {
                    'id': business.manufacturer.id,
                    'username': business.manufacturer.username,
                    'email': business.manufacturer.email,
                    'first_name': business.manufacturer.first_name,
                    'last_name': business.manufacturer.last_name,
                } if business.manufacturer else None,
                'pending_manufacturers': []
            }
            
            # Get pending manufacturers (if any)
            # This would depend on your business logic for pending manufacturers
            # For now, we'll return an empty list
            
            result.append(business_data)
        
        return Response(result)


class CustomerBusinessInviteCodeView(APIView):
    """
    Returns invite_code for a customer's business.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get customer business invite code"""
        user = request.user
        if user.role != "customer":
            return Response({"detail": "Only customers can access this endpoint."}, status=403)

        # Get the business owned by this customer
        business = Business.objects.filter(owner=user).first()
        if not business:
            return Response({"detail": "No business found for this customer."}, status=404)

        return Response({
            'invite_code': business.invite_code,
            'business_id': business.id,
            'business_name': business.name
        })


class CustomerBusinessManufacturerView(APIView):
    """
    Returns business invite_code, approved manufacturer, and pending manufacturers for a customer's business.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != "customer":
            return Response({"detail": "Only customers can access this endpoint."}, status=403)

        business = Business.objects.filter(owner=user).first()
        if not business:
            return Response({"detail": "Customer has no associated business."}, status=404)

        # Get approved manufacturer data
        manufacturer_data = None
        if business.manufacturer:
            manufacturer_data = {
                'id': business.manufacturer.id,
                'username': business.manufacturer.username,
                'email': business.manufacturer.email,
                'first_name': business.manufacturer.first_name,
                'last_name': business.manufacturer.last_name,
                'location': business.manufacturer.location,
                'company_name': business.manufacturer.company_name,
                'description': business.manufacturer.description,
            }

        # Get pending manufacturers
        pending_manufacturers = []
        for pending_user in business.pending_manufacturers.all():
            pending_manufacturers.append({
                'id': pending_user.id,
                'username': pending_user.username,
                'email': pending_user.email,
                'first_name': pending_user.first_name,
                'last_name': pending_user.last_name,
                'location': pending_user.location,
                'company_name': pending_user.company_name,
                'description': pending_user.description,
            })

        # Get rejected manufacturers
        rejected_manufacturers = []
        for rejected_user in business.rejected_manufacturers.all():
            rejected_manufacturers.append({
                'id': rejected_user.id,
                'username': rejected_user.username,
                'email': rejected_user.email,
                'first_name': rejected_user.first_name,
                'last_name': rejected_user.last_name,
                'location': rejected_user.location,
                'company_name': rejected_user.company_name,
                'description': rejected_user.description,
            })

        return Response({
            'business_id': business.id,
            'business_name': business.name,
            'invite_code': business.invite_code,
            'approved_manufacturer': manufacturer_data,
            'pending_manufacturers': pending_manufacturers,
            'rejected_manufacturers': rejected_manufacturers,
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_business(request):
    """Join a business using invite code"""
    invite_code = request.data.get('invite_code')
    if not invite_code:
        return Response({"detail": "Invite code is required."}, status=400)
    
    try:
        business = Business.objects.get(invite_code=invite_code)
        if business.owner:
            return Response({"detail": "Business already has an owner."}, status=400)
        
        business.owner = request.user
        business.save()
        
        return Response({
            "detail": "Successfully joined business.",
            "business_id": business.id,
            "business_name": business.name
        }, status=200)
        
    except Business.DoesNotExist:
        return Response({"detail": "Invalid invite code."}, status=404)


class EndCustomerViewSet(viewsets.ModelViewSet):
    """
    End Customer ViewSet
    --------------------
    Handles CRUD operations for end customers.
    """
    serializer_class = EndCustomerSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter end customers by business and user permissions"""
        business_id = self.request.query_params.get('business')
        user = self.request.user
        
        if not business_id:
            # If no business_id provided, return empty queryset
            return EndCustomer.objects.none()
        
        # Check if user has access to this business
        if user.role == 'customer':
            # Customers can only access their own business
            customer_business = Business.objects.filter(owner=user).first()
            if not customer_business or str(customer_business.id) != str(business_id):
                return EndCustomer.objects.none()
        else:
            # Manufacturers can access businesses they're associated with
            manufacturer_business = Business.objects.filter(
                manufacturer=user,
                id=business_id
            ).first()
            if not manufacturer_business:
                return EndCustomer.objects.none()
        
        return EndCustomer.objects.filter(business_id=business_id)

    def perform_create(self, serializer):
        """Create end customer with business assignment"""
        business_id = self.request.data.get('business')
        if not business_id:
            raise ValidationError("Business ID is required")
        serializer.save(business_id=business_id)

    def perform_update(self, serializer):
        """Update end customer with permission validation"""
        business_id = self.request.data.get('business')
        if not business_id:
            raise ValidationError("Business ID is required")
        serializer.save(business_id=business_id)

    def perform_destroy(self, instance):
        """Delete end customer with permission validation"""
        # The permission is already checked in get_queryset
        instance.delete()


class InvoiceViewSet(viewsets.ModelViewSet):
    """
    Invoice ViewSet
    ---------------
    Handles CRUD operations for invoices with business-specific filtering.
    """
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return InvoiceCreateSerializer
        return InvoiceSerializer

    def get_queryset(self):
        """Filter invoices by business, user permissions, and status-based visibility"""
        business_id = self.request.query_params.get('business')
        invoice_type = self.request.query_params.get('invoice_type') or self.request.query_params.get('type')
        user = self.request.user
        qs = Invoice.objects.all()
        
        # Apply role-based permissions and status filtering
        if user.role == 'customer':
            # For customers, always filter by their business
            customer_business = Business.objects.filter(owner=user).first()
            if customer_business:
                qs = qs.filter(business=customer_business)
                # If business_id is provided, ensure it matches the customer's business
                if business_id and str(customer_business.id) != str(business_id):
                    qs = qs.none()  # No access if business_id doesn't match
                print(f"InvoiceViewSet: Customer {user.username} - Can see invoices for business {customer_business.id}")
            else:
                qs = qs.none()
                print(f"InvoiceViewSet: Customer {user.username} - No business found")
        else:
            # Manufacturer can see invoices from their businesses
            if business_id:
                # Filter by specific business if provided
                qs = qs.filter(business_id=business_id, business__manufacturer=user)
            else:
                # Filter by all businesses the manufacturer is associated with
                qs = qs.filter(business__manufacturer=user)
            
            # Manufacturers should only see manufacturer invoices, not customer invoices
            # If no invoice_type filter is provided, default to manufacturer invoices
            if not invoice_type:
                qs = qs.filter(invoice_type='manufacturer')
            print(f"InvoiceViewSet: Manufacturer {user.username} - Can see manufacturer invoices only")
        
        # Apply invoice_type filter if provided
        if invoice_type:
            qs = qs.filter(invoice_type=invoice_type)
        
        print(f"InvoiceViewSet: Final query count: {qs.count()}")
        
        return qs.select_related('business', 'order')

    def perform_create(self, serializer):
        """Create invoice with automatic business assignment"""
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def revenue_summary(self, request):
        business_id = request.query_params.get('business')
        
        if not business_id:
            return Response({'error': 'Business ID required'}, status=400)
        
        from django.db.models import Sum, Count
        from django.utils import timezone
        from datetime import timedelta
        
        # Get current date and calculate periods
        now = timezone.now()
        month_ago = now - timedelta(days=30)
        quarter_ago = now - timedelta(days=90)
        year_ago = now - timedelta(days=365)
        
        # Calculate customer revenue (include pending invoices)
        customer_revenue = Invoice.objects.filter(
            business_id=business_id,
            invoice_type='customer',
            status__in=['paid', 'pending']
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        # Calculate manufacturer costs (include pending invoices)
        manufacturer_costs = Invoice.objects.filter(
            business_id=business_id,
            invoice_type='manufacturer',
            status__in=['paid', 'pending']
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        # Calculate net profit
        net_profit = customer_revenue - manufacturer_costs
        
        # Get sales statistics
        total_sales = Invoice.objects.filter(
            business_id=business_id,
            invoice_type='customer'
        ).count()
        
        paid_sales = Invoice.objects.filter(
            business_id=business_id,
            invoice_type='customer',
            status='paid'
        ).count()
        
        pending_sales = Invoice.objects.filter(
            business_id=business_id,
            invoice_type='customer',
            status='pending'
        ).count()
        
        # Calculate payment rate (paid vs total)
        payment_rate = (paid_sales / total_sales * 100) if total_sales > 0 else 0
        
        # Calculate period-over-period growth
        current_month_revenue = Invoice.objects.filter(
            business_id=business_id,
            invoice_type='customer',
            status__in=['paid', 'pending'],
            created_at__gte=month_ago
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        previous_month_revenue = Invoice.objects.filter(
            business_id=business_id,
            invoice_type='customer',
            status__in=['paid', 'pending'],
            created_at__gte=month_ago - timedelta(days=30),
            created_at__lt=month_ago
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        revenue_growth = 0
        if previous_month_revenue > 0:
            revenue_growth = ((current_month_revenue - previous_month_revenue) / previous_month_revenue) * 100
        
        # Calculate profit growth
        current_month_profit = current_month_revenue - (Invoice.objects.filter(
            business_id=business_id,
            invoice_type='manufacturer',
            status__in=['paid', 'pending'],
            created_at__gte=month_ago
        ).aggregate(total=Sum('total_amount'))['total'] or 0)
        
        previous_month_profit = previous_month_revenue - (Invoice.objects.filter(
            business_id=business_id,
            invoice_type='manufacturer',
            status__in=['paid', 'pending'],
            created_at__gte=month_ago - timedelta(days=30),
            created_at__lt=month_ago
        ).aggregate(total=Sum('total_amount'))['total'] or 0)
        
        profit_growth = 0
        if previous_month_profit != 0:
            profit_growth = ((current_month_profit - previous_month_profit) / abs(previous_month_profit)) * 100
        
        return Response({
            'customer_revenue': float(customer_revenue),
            'manufacturer_costs': float(manufacturer_costs),
            'net_profit': float(net_profit),
            'total_sales': total_sales,
            'paid_sales': paid_sales,
            'pending_sales': pending_sales,
            'payment_rate': float(payment_rate),
            'revenue_growth': float(revenue_growth),
            'profit_growth': float(profit_growth),
            'current_month_revenue': float(current_month_revenue),
            'previous_month_revenue': float(previous_month_revenue),
            'current_month_profit': float(current_month_profit),
            'previous_month_profit': float(previous_month_profit)
        })

    @action(detail=True, methods=['patch'], url_path='change_status')
    def change_status_explicit(self, request, pk=None):
        """Change invoice status explicitly"""
        print(f"InvoiceViewSet: change_status_explicit called with pk={pk}")
        print(f"InvoiceViewSet: request.data={request.data}")
        
        invoice = self.get_object()
        print(f"InvoiceViewSet: Found invoice {invoice.id} with current status {invoice.status}")
        
        new_status = request.data.get('status')
        
        if not new_status:
            print(f"InvoiceViewSet: No status provided in request")
            return Response({"detail": "Status is required."}, status=400)
        
        if new_status not in dict(Invoice.STATUS_CHOICES):
            print(f"InvoiceViewSet: Invalid status '{new_status}'")
            return Response({"detail": "Invalid status."}, status=400)
        
        # Check permissions based on user role
        user = request.user
        if user.role == 'customer':
            # Customers can change invoices for their own business
            if invoice.business.owner != user:
                return Response({"detail": "You can only change invoices for your own business."}, status=403)
            
            # Customers can change manufacturer invoices (paying for services) to paid
            # and customer invoices (receiving payments) to various statuses
            if invoice.invoice_type == 'manufacturer':
                # For manufacturer invoices, customers can mark as paid when paying
                if new_status == 'paid':
                    pass  # Allow this transition
                else:
                    return Response({"detail": "Customers can only mark manufacturer invoices as paid."}, status=400)
            else:
                # For customer invoices, allow more transitions
                allowed_transitions = [
                    ('draft', 'pending'),
                    ('pending', 'sent'),
                    ('sent', 'paid'),
                    ('pending', 'paid'),
                    ('sent', 'overdue'),
                    ('overdue', 'paid')
                ]
                if (invoice.status, new_status) not in allowed_transitions:
                    return Response({"detail": f"Cannot change status from {invoice.status} to {new_status}."}, status=400)
        else:
            # Manufacturers can change any invoice status for their businesses
            if invoice.business.manufacturer != user:
                return Response({"detail": "You can only change invoices for your own businesses."}, status=403)
        
        print(f"InvoiceViewSet: Updating invoice {invoice.id} status from {invoice.status} to {new_status}")
        invoice.status = new_status
        invoice.save()
        
        serializer = self.get_serializer(invoice)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='download')
    def download_invoice(self, request, pk=None):
        """Download invoice as PDF"""
        try:
            invoice = self.get_object()
            print(f"InvoiceViewSet: Downloading invoice {pk} - {invoice.invoice_number}")
            
            # Import here to avoid circular imports
            from .report_generators import ReportGenerator
            
            # Generate PDF
            pdf_buffer = ReportGenerator.generate_invoice_pdf(invoice)
            
            # Create response
            response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="invoice_{invoice.invoice_number}.pdf"'
            
            print(f"InvoiceViewSet: Successfully generated PDF for invoice {pk}")
            return response
            
        except Exception as e:
            import traceback
            print(f"InvoiceViewSet: Error downloading invoice {pk}: {e}")
            print(f"InvoiceViewSet: Traceback: {traceback.format_exc()}")
            return Response({"detail": f"Failed to generate PDF: {str(e)}"}, status=500)

    @action(detail=False, methods=['get'])
    def generate_number(self, request):
        """Generate a unique invoice number"""
        business_id = request.query_params.get('business')
        invoice_type = request.query_params.get('invoice_type', 'manufacturer')
        
        if not business_id:
            return Response({"detail": "Business ID is required."}, status=400)
        
        try:
            # Get the business
            business = Business.objects.get(id=business_id)
            
            # Get the latest invoice number for this business and type
            latest_invoice = Invoice.objects.filter(
                business=business,
                invoice_type=invoice_type
            ).order_by('-invoice_number').first()
            
            # Generate prefix based on invoice type
            prefix = 'MFG' if invoice_type == 'manufacturer' else 'CUST'
            
            if latest_invoice and latest_invoice.invoice_number:
                # Extract number from existing invoice number
                try:
                    # Assuming format: PREFIX-YYYYMMDD-XXXX
                    parts = latest_invoice.invoice_number.split('-')
                    if len(parts) >= 3:
                        last_number = int(parts[-1])
                        new_number = last_number + 1
                    else:
                        new_number = 1
                except (ValueError, IndexError):
                    new_number = 1
            else:
                new_number = 1
            
            # Format: PREFIX-YYYYMMDD-XXXX
            from datetime import datetime
            date_str = datetime.now().strftime('%Y%m%d')
            invoice_number = f"{prefix}-{date_str}-{new_number:04d}"
            
            return Response({
                "invoice_number": invoice_number
            }, status=200)
            
        except Business.DoesNotExist:
            return Response({"detail": "Business not found."}, status=404)
        except Exception as e:
            print(f"InvoiceViewSet: Error generating invoice number: {e}")
            return Response({"detail": "Failed to generate invoice number."}, status=500)

    def list(self, request, *args, **kwargs):
        """Override list method to add error handling"""
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            print(f"InvoiceViewSet: Error in list method: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {"detail": "An error occurred while fetching invoices. Please try again."}, 
                status=500
            )


class EnhancedInvoiceView(APIView):
    """
    Enhanced Invoice View
    ---------------------
    Handles enhanced invoice creation with multiple orders and detailed line items.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Create enhanced invoice with multiple orders"""
        user = request.user
        if user.role != 'manufacturer':
            return Response({"detail": "Only manufacturers can create invoices."}, status=403)
        
        print(f"EnhancedInvoiceView: Received request data: {request.data}")
        print(f"EnhancedInvoiceView: User: {user.username}, Role: {user.role}")
        
        # Validate required fields
        required_fields = ['business', 'customer_name', 'due_date', 'amount']
        for field in required_fields:
            if field not in request.data:
                print(f"EnhancedInvoiceView: Missing required field: {field}")
                return Response({"detail": f"Missing required field: {field}"}, status=400)
        
        try:
            # Create invoice
            invoice_data = {
                'business': request.data['business'],  # Use 'business' instead of 'business_id'
                'customer_name': request.data['customer_name'],
                'due_date': request.data['due_date'],
                'amount': request.data['amount'],
                'status': 'draft'
            }
            
            # Add optional fields
            optional_fields = ['bill_to', 'contact_info', 'po_number', 'notes', 
                             'line_items', 'subtotal', 'tax_percentage', 'tax_amount', 'total_amount',
                             'advanced_paid', 'balance_due', 'payment_instructions',
                             'contact_for_questions', 'thank_you_message']
            
            for field in optional_fields:
                if field in request.data:
                    invoice_data[field] = request.data[field]
            
            # Handle related orders
            if 'related_orders' in request.data:
                invoice_data['related_orders'] = request.data['related_orders']
            
            print(f"EnhancedInvoiceView: Prepared invoice_data: {invoice_data}")
            
            serializer = InvoiceSerializer(data=invoice_data, context={'request': request})
            if serializer.is_valid():
                print(f"EnhancedInvoiceView: Serializer is valid, creating invoice...")
                invoice = serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                print(f"EnhancedInvoiceView: Serializer errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, invoice_id):
        """Update enhanced invoice"""
        user = request.user
        if user.role != 'manufacturer':
            return Response({"detail": "Only manufacturers can update invoices."}, status=403)
        
        try:
            invoice = Invoice.objects.get(id=invoice_id, business__manufacturer=user)
            
            # Update invoice data
            serializer = InvoiceSerializer(invoice, data=request.data, partial=True, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        except Invoice.DoesNotExist:
            return Response({"detail": "Invoice not found."}, status=404)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class NumberConfigViewSet(viewsets.ModelViewSet):
    """
    Number Configuration ViewSet
    -----------------------------
    Handles CRUD operations for number configuration (orders and invoices).
    """
    queryset = NumberConfig.objects.all()
    serializer_class = NumberConfigSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter number configs by business, user permissions, and config type"""
        business_id = self.request.query_params.get('business')
        config_type = self.request.query_params.get('config_type')
        user = self.request.user
        qs = self.queryset
        
        if business_id:
            qs = qs.filter(business_id=business_id)
        
        # Apply role-based permissions and config type filtering
        if user.role == 'customer':
            customer_business = Business.objects.filter(owner=user).first()
            if customer_business:
                qs = qs.filter(business=customer_business)
                # Customers should see order and customer invoice configurations
                if not config_type:
                    qs = qs.filter(config_type__in=['order', 'customer_invoice'])
                else:
                    qs = qs.filter(config_type=config_type)
            else:
                qs = qs.none()
        else:
            # Manufacturer can see configs from their businesses
            qs = qs.filter(business__manufacturer=user)
            # Manufacturers should only see manufacturer invoice configurations
            if not config_type:
                qs = qs.filter(config_type='manufacturer_invoice')
            else:
                qs = qs.filter(config_type=config_type)
        
        return qs.select_related('business')

    def perform_create(self, serializer):
        """Create number config with automatic business assignment"""
        user = self.request.user
        if user.role == 'customer':
            business = Business.objects.filter(owner=user).first()
            if not business:
                raise ValidationError("Customer has no associated business")
            serializer.save(business=business)
        else:
            # For manufacturers, business should be provided in request data
            serializer.save() 

class ManufacturerCustomerOverviewView(APIView):
    """
    Manufacturer sees all customers with their businesses grouped
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != "manufacturer":
            return Response({"detail": "Only manufacturers can access this endpoint."}, status=403)

        # Get all businesses where manufacturer has any relationship
        businesses = Business.objects.filter(
            Q(manufacturer=user) |  # Approved manufacturer
            Q(pending_manufacturers=user) |  # Pending manufacturer
            Q(rejected_manufacturers=user)   # Rejected manufacturer
        ).select_related('owner').prefetch_related('products', 'orders')

        # Group businesses by customer
        customers_data = {}
        
        for business in businesses:
            customer = business.owner
            if customer.id not in customers_data:
                customers_data[customer.id] = {
                    'customer_id': customer.id,
                    'customer_name': f"{customer.first_name} {customer.last_name}",
                    'customer_email': customer.email,
                    'customer_username': customer.username,
                    'total_businesses': 0,
                    'total_products': 0,
                    'total_orders': 0,
                    'businesses': [],
                    'relationship_status': 'none'
                }
            
            # Determine relationship status for this business
            if business.manufacturer == user:
                status = 'approved'
            elif business.pending_manufacturers.filter(id=user.id).exists():
                status = 'pending'
            elif business.rejected_manufacturers.filter(id=user.id).exists():
                status = 'rejected'
            else:
                status = 'none'
            
            # Update customer's overall status (if any business is approved, customer is approved)
            if status == 'approved':
                customers_data[customer.id]['relationship_status'] = 'approved'
            elif status == 'pending' and customers_data[customer.id]['relationship_status'] != 'approved':
                customers_data[customer.id]['relationship_status'] = 'pending'
            elif status == 'rejected' and customers_data[customer.id]['relationship_status'] not in ['approved', 'pending']:
                customers_data[customer.id]['relationship_status'] = 'rejected'
            
            # Add business data
            business_data = {
                'business_id': business.id,
                'business_name': business.name,
                'business_slogan': business.slogan,
                'location': customer.location,  # Use customer's location instead of business location
                'invite_code': business.invite_code,
                'relationship_status': status,
                'total_products': business.products.count(),
                'total_orders': business.orders.count(),
                'last_activity': business.orders.order_by('-created_at').first().created_at if business.orders.exists() else None
            }
            
            customers_data[customer.id]['businesses'].append(business_data)
            customers_data[customer.id]['total_businesses'] += 1
            customers_data[customer.id]['total_products'] += business_data['total_products']
            customers_data[customer.id]['total_orders'] += business_data['total_orders']

        return Response(list(customers_data.values())) 

class CustomerDiscoveryView(APIView):
    """
    Customer Discovery View - Manufacturers can browse all customers with their businesses and products
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != "manufacturer":
            return Response({"detail": "Only manufacturers can access this endpoint."}, status=403)

        # Get all customers with their businesses and products
        customers = User.objects.filter(role='customer').prefetch_related(
            'owned_businesses__products',
            'owned_businesses__products__field_values',
            'owned_businesses__products__category'
        )

        customers_data = []
        
        for customer in customers:
            customer_businesses = []
            
            for business in customer.owned_businesses.filter(is_public=True):
                # Get products for this business
                products = business.products.all()
                products_data = []
                
                for product in products:
                    # Get product field values
                    field_values = {}
                    for field_value in product.field_values.all():
                        field_values[field_value.field.label] = field_value.value
                    
                    products_data.append({
                        'product_id': product.id,
                        'product_name': product.name or f"Product {product.id}",
                        'product_image': request.build_absolute_uri(product.image.url) if product.image else None,
                        'field_values': field_values,
                        'category': product.category.name if product.category else None,
                        'created_at': product.created_at
                    })
                
                # Check if manufacturer has any relationship with this business
                relationship_status = 'none'
                if business.manufacturer == user:
                    relationship_status = 'approved'
                elif business.pending_manufacturers.filter(id=user.id).exists():
                    relationship_status = 'pending'
                elif business.rejected_manufacturers.filter(id=user.id).exists():
                    relationship_status = 'rejected'
                
                business_data = {
                    'business_id': business.id,
                    'business_name': business.name,
                    'business_slogan': business.slogan,
                    'location': customer.location,  # Use customer's location instead of business location
                    'relationship_status': relationship_status,
                    'total_products': products.count(),
                    'products': products_data
                }
                
                customer_businesses.append(business_data)
            
            if customer_businesses:  # Only include customers who have businesses
                customer_data = {
                    'customer_id': customer.id,
                    'customer_name': f"{customer.first_name} {customer.last_name}",
                    'customer_email': customer.email,
                    'customer_username': customer.username,
                    'location': customer.location,  # Add customer location
                    'total_businesses': len(customer_businesses),
                    'total_products': sum(biz['total_products'] for biz in customer_businesses),
                    'businesses': customer_businesses
                }
                customers_data.append(customer_data)

        return Response(customers_data) 

class ManufacturerRequestView(APIView):
    """
    Manufacturer Request View - Send contact and join requests
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.role != "manufacturer":
            return Response({"detail": "Only manufacturers can send requests."}, status=403)
        
        # Get request data
        business_id = request.data.get('business_id')
        request_type = request.data.get('request_type')  # 'contact' or 'join'
        manufacturer_name = request.data.get('manufacturer_name')
        manufacturer_email = request.data.get('manufacturer_email')
        manufacturer_phone = request.data.get('manufacturer_phone', '')
        manufacturer_company = request.data.get('manufacturer_company', '')
        message = request.data.get('message', '')
        
        # Validate required fields
        required_fields = ['business_id', 'request_type', 'manufacturer_name', 'manufacturer_email', 'message']
        for field in required_fields:
            if not request.data.get(field):
                return Response({"detail": f"{field} is required."}, status=400)
        
        try:
            business = Business.objects.get(id=business_id)
        except Business.DoesNotExist:
            return Response({"detail": "Business not found."}, status=404)
        
        # Check if request already exists (considering the unique constraint)
        existing_request = ManufacturerRequest.objects.filter(
            manufacturer=user,
            business=business,
            request_type=request_type
        ).first()
        
        if existing_request:
            return Response({"detail": f"A {request_type} request already exists for this business."}, status=400)
        
        # Check request limit (max 5 pending requests)
        pending_count = ManufacturerRequest.objects.filter(
            manufacturer=user,
            status='pending'
        ).count()
        
        if pending_count >= 5:
            return Response({
                "detail": "You have reached the limit of 5 pending requests. Please wait for responses before sending new requests.",
                "pending_count": pending_count,
                "limit": 5
            }, status=400)
        
        # Create the request
        manufacturer_request = ManufacturerRequest.objects.create(
            manufacturer=user,
            customer=business.owner,
            business=business,
            request_type=request_type,
            manufacturer_name=manufacturer_name,
            manufacturer_email=manufacturer_email,
            manufacturer_phone=manufacturer_phone,
            manufacturer_company=manufacturer_company,
            message=message
        )
        
        # Send email notification to customer
        try:
            from .utils import send_request_received_email
            send_request_received_email(manufacturer_request)
        except Exception as e:
            print(f"Failed to send email notification: {e}")
        
        return Response({
            'id': manufacturer_request.id,
            'status': 'pending',
            'message': f'{request_type.title()} request sent successfully!'
        })


class CustomerToManufacturerRequestView(APIView):
    """
    Customer to Manufacturer Request View - Customers can send requests to manufacturers
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.role != "customer":
            return Response({"detail": "Only customers can send requests to manufacturers."}, status=403)
        
        # Get request data
        manufacturer_id = request.data.get('manufacturer_id')
        request_type = request.data.get('request_type')  # 'contact' or 'join'
        message = request.data.get('message', '')
        
        # Validate required fields
        required_fields = ['manufacturer_id', 'request_type', 'message']
        for field in required_fields:
            if not request.data.get(field):
                return Response({"detail": f"{field} is required."}, status=400)
        
        try:
            manufacturer = User.objects.get(id=manufacturer_id, role='manufacturer')
        except User.DoesNotExist:
            return Response({"detail": "Manufacturer not found."}, status=404)
        
        # Get customer's business
        try:
            business = Business.objects.get(owner=user)
        except Business.DoesNotExist:
            return Response({"detail": "You need to create a business first."}, status=400)
        
        # Check if request already exists (considering the unique constraint)
        existing_request = ManufacturerRequest.objects.filter(
            manufacturer=manufacturer,
            business=business,
            request_type=request_type
        ).first()
        
        if existing_request:
            return Response({"detail": f"A {request_type} request already exists between you and this manufacturer."}, status=400)
        
        # Create the request (reverse the roles for customer-to-manufacturer)
        manufacturer_request = ManufacturerRequest.objects.create(
            manufacturer=manufacturer,
            customer=user,
            business=business,
            request_type=request_type,
            manufacturer_name=manufacturer.get_full_name() or manufacturer.username,
            manufacturer_email=manufacturer.email,
            manufacturer_phone=manufacturer.phone if hasattr(manufacturer, 'phone') else '',
            manufacturer_company=manufacturer.company_name if hasattr(manufacturer, 'company_name') else '',
            message=message
        )
        
        # Send email notification to manufacturer
        try:
            from .utils import send_request_received_email
            send_request_received_email(manufacturer_request)
        except Exception as e:
            print(f"Failed to send email notification: {e}")
        
        return Response({
            'id': manufacturer_request.id,
            'status': 'pending',
            'message': f'{request_type.title()} request sent successfully to {manufacturer.get_full_name()}!'
        })


class CustomerRequestManagementView(APIView):
    """
    Customer Request Management View - Customers can view and respond to requests
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != "customer":
            return Response({"detail": "Only customers can access this endpoint."}, status=403)
        
        # Get all requests for this customer (incoming from manufacturers)
        requests = ManufacturerRequest.objects.filter(customer=user).select_related(
            'manufacturer', 'business'
        ).order_by('-created_at')
        
        requests_data = []
        for req in requests:
            requests_data.append({
                'id': req.id,
                'request_type': req.request_type,
                'status': req.status,
                'business_name': req.business.name,
                'business_id': req.business.id,
                'manufacturer_name': req.manufacturer_name,
                'manufacturer_email': req.manufacturer_email,
                'manufacturer_company': req.manufacturer_company,
                'manufacturer_location': req.manufacturer.location,
                'message': req.message,
                'customer_response': req.customer_response,
                'customer_notes': req.customer_notes,
                'created_at': req.created_at,
                'responded_at': req.responded_at
            })
        
        return Response(requests_data)

    def patch(self, request, request_id):
        """
        Update request status (approve/reject) for incoming manufacturer requests
        """
        user = request.user
        if user.role != "customer":
            return Response({"detail": "Only customers can respond to requests."}, status=403)
        
        try:
            manufacturer_request = ManufacturerRequest.objects.get(
                id=request_id, 
                customer=user
            )
        except ManufacturerRequest.DoesNotExist:
            return Response({"detail": "Request not found."}, status=404)
        
        action = request.data.get('action')  # 'approve' or 'reject'
        rejection_reason = request.data.get('rejection_reason', '')
        response_message = request.data.get('response_message', '')
        notes = request.data.get('notes', '')
        
        if action not in ['approve', 'reject']:
            return Response({"detail": "Action must be 'approve' or 'reject'."}, status=400)
        
        # Update request status
        manufacturer_request.status = 'approved' if action == 'approve' else 'rejected'
        
        if action == 'reject':
            manufacturer_request.customer_response = rejection_reason
        else:
            manufacturer_request.customer_response = response_message
            
        manufacturer_request.customer_notes = notes
        manufacturer_request.responded_at = timezone.now()
        manufacturer_request.save()
        
        return Response({
            "detail": f"Request {action}d successfully.",
            "status": manufacturer_request.status
        }, status=status.HTTP_200_OK)


class CustomerMyRequestsView(APIView):
    """
    Customer My Requests View - Customers can view requests they sent to manufacturers
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != "customer":
            return Response({"detail": "Only customers can access this endpoint."}, status=403)
        
        # Get all requests sent by this customer to manufacturers
        # Note: In this model, customers don't typically send requests to manufacturers
        # This would be for cases where a customer acts as a manufacturer for another business
        requests = ManufacturerRequest.objects.filter(manufacturer=user).select_related(
            'customer', 'business'
        ).order_by('-created_at')
        
        requests_data = []
        for req in requests:
            requests_data.append({
                'id': req.id,
                'request_type': req.request_type,
                'status': req.status,
                'business_name': req.business.name,
                'business_id': req.business.id,
                'customer_name': f"{req.customer.first_name} {req.customer.last_name}".strip(),
                'customer_email': req.customer.email,
                'customer_location': req.customer.location or 'Location not specified',
                'customer_company': req.customer.company_name or 'General',
                'message': req.message,
                'customer_response': req.customer_response,
                'customer_notes': req.customer_notes,
                'created_at': req.created_at,
                'responded_at': req.responded_at
            })
        
        return Response(requests_data)
    
    def patch(self, request, request_id):
        user = request.user
        if user.role != "customer":
            return Response({"detail": "Only customers can respond to requests."}, status=403)
        
        try:
            manufacturer_request = ManufacturerRequest.objects.get(
                id=request_id, 
                customer=user
            )
        except ManufacturerRequest.DoesNotExist:
            return Response({"detail": "Request not found."}, status=404)
        
        action = request.data.get('action')  # 'approve' or 'reject'
        response_message = request.data.get('response_message', '')
        notes = request.data.get('notes', '')
        
        if action not in ['approve', 'reject']:
            return Response({"detail": "Action must be 'approve' or 'reject'."}, status=400)
        
        # Update request status
        manufacturer_request.status = 'approved' if action == 'approve' else 'rejected'
        manufacturer_request.customer_response = response_message
        manufacturer_request.customer_notes = notes
        manufacturer_request.save()
        
        # Send email notification to manufacturer
        try:
            from .utils import send_request_status_email
            send_request_status_email(manufacturer_request, manufacturer_request.status)
        except Exception as e:
            print(f"Failed to send email notification: {e}")
        
        # If approved, create a chat room for communication
        if action == 'approve':
            # Create chat room if it doesn't exist
            chat_room, created = ChatRoom.objects.get_or_create(
                customer=manufacturer_request.customer,
                manufacturer=manufacturer_request.manufacturer,
                request=manufacturer_request,
                defaults={'is_active': True}
            )
            
            # If it's a join request, add manufacturer to business
            if manufacturer_request.request_type == 'join':
                business = manufacturer_request.business
                business.manufacturer = manufacturer_request.manufacturer
                business.pending_manufacturers.remove(manufacturer_request.manufacturer)
                business.rejected_manufacturers.remove(manufacturer_request.manufacturer)
                business.save()
        
        return Response({
            'status': manufacturer_request.status,
            'message': f'Request {action}d successfully!'
        })


class ManufacturerRequestHistoryView(APIView):
    """
    Manufacturer Request History View - Manufacturers can view their sent requests
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != "manufacturer":
            return Response({"detail": "Only manufacturers can access this endpoint."}, status=403)
        
        # Get all requests sent by this manufacturer
        requests = ManufacturerRequest.objects.filter(manufacturer=user).select_related(
            'customer', 'business'
        ).order_by('-created_at')
        
        requests_data = []
        for req in requests:
            # Check if manufacturer is already joined to this business
            is_joined = req.business.manufacturer == user
            is_pending_join = req.business.pending_manufacturers.filter(id=user.id).exists()
            
            requests_data.append({
                'id': req.id,
                'request_type': req.request_type,
                'status': req.status,
                'business_name': req.business.name,
                'business_id': req.business.id,
                'customer_name': f"{req.customer.first_name} {req.customer.last_name}".strip(),
                'customer_email': req.customer.email,
                'customer_location': req.customer.location,
                'message': req.message,
                'customer_response': req.customer_response,
                'customer_notes': req.customer_notes,
                'created_at': req.created_at,
                'responded_at': req.responded_at,
                'is_joined': is_joined,
                'is_pending_join': is_pending_join,
                'direction': 'outgoing'  # Add direction indicator
            })
        
        return Response(requests_data)


class ManufacturerRequestDetailView(APIView):
    """
    Manufacturer Request Detail View - Get specific request details
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, request_id):
        user = request.user
        if user.role != "manufacturer":
            return Response({"detail": "Only manufacturers can access this endpoint."}, status=403)
        
        try:
            req = ManufacturerRequest.objects.select_related('customer', 'business').get(
                id=request_id, 
                manufacturer=user
            )
        except ManufacturerRequest.DoesNotExist:
            return Response({"detail": "Request not found."}, status=404)
        
        request_data = {
            'id': req.id,
            'request_type': req.request_type,
            'status': req.status,
            'business_name': req.business.name,
            'business_id': req.business.id,
            'business_slogan': req.business.slogan,

            'customer_name': f"{req.customer.first_name} {req.customer.last_name}".strip(),
            'customer_email': req.customer.email,
            'customer_location': req.customer.location,
            'manufacturer_name': req.manufacturer_name,
            'manufacturer_email': req.manufacturer_email,
            'manufacturer_company': req.manufacturer_company,
            'manufacturer_phone': req.manufacturer_phone,
            'message': req.message,
            'customer_response': req.customer_response,
            'customer_notes': req.customer_notes,
            'created_at': req.created_at,
            'responded_at': req.responded_at
        }
        
        return Response(request_data)


class ManufacturerRequestStatsView(APIView):
    """
    Manufacturer Request Statistics View - Get request statistics
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != "manufacturer":
            return Response({"detail": "Only manufacturers can access this endpoint."}, status=403)
        
        # Get all requests for this manufacturer
        requests = ManufacturerRequest.objects.filter(manufacturer=user)
        
        # Calculate statistics
        total_requests = requests.count()
        pending_requests = requests.filter(status='pending').count()
        approved_requests = requests.filter(status='approved').count()
        rejected_requests = requests.filter(status='rejected').count()
        
        # Calculate success rate
        success_rate = 0
        if total_requests > 0:
            success_rate = round((approved_requests / total_requests) * 100, 1)
        
        # Calculate average response time for responded requests
        responded_requests = requests.filter(status__in=['approved', 'rejected'])
        avg_response_time = None
        if responded_requests.exists():
            total_days = 0
            for req in responded_requests:
                if req.responded_at:
                    days = (req.responded_at - req.created_at).days
                    total_days += days
            avg_response_time = round(total_days / responded_requests.count(), 1)
        
        stats = {
            'total_requests': total_requests,
            'pending_requests': pending_requests,
            'approved_requests': approved_requests,
            'rejected_requests': rejected_requests,
            'success_rate': success_rate,
            'avg_response_time_days': avg_response_time,
            'pending_limit': 5,
            'can_send_new_request': pending_requests < 5
        }
        
        return Response(stats)


class ManufacturerRequestLimitCheckView(APIView):
    """
    Manufacturer Request Limit Check View - Check if manufacturer can send new requests
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != "manufacturer":
            return Response({"detail": "Only manufacturers can access this endpoint."}, status=403)
        
        pending_count = ManufacturerRequest.objects.filter(
            manufacturer=user, 
            status='pending'
        ).count()
        
        can_send = pending_count < 5
        
        return Response({
            'pending_count': pending_count,
            'can_send': can_send,
            'limit': 5,
            'remaining': max(0, 5 - pending_count)
        })


class ManufacturerIncomingRequestsView(APIView):
    """
    Manufacturer Incoming Requests View - Manufacturers can view requests from customers
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != "manufacturer":
            return Response({"detail": "Only manufacturers can access this endpoint."}, status=403)
        
        # Get all requests sent TO this manufacturer (where customer is the sender)
        # This should show requests where the customer is the sender, not the manufacturer
        requests = ManufacturerRequest.objects.filter(
            business__owner__isnull=False,  # Ensure business has an owner (customer)
            business__manufacturer=user  # Requests for this manufacturer's businesses
        ).exclude(
            manufacturer=user  # Exclude requests sent by this manufacturer
        ).select_related(
            'customer', 'business'
        ).order_by('-created_at')
        
        requests_data = []
        for req in requests:
            requests_data.append({
                'id': req.id,
                'request_type': req.request_type,
                'status': req.status,
                'business_name': req.business.name,
                'business_id': req.business.id,
                'customer_name': f"{req.customer.first_name} {req.customer.last_name}".strip(),
                'customer_email': req.customer.email,
                'customer_location': req.customer.location,
                'message': req.message,
                'customer_response': req.customer_response,
                'customer_notes': req.customer_notes,
                'created_at': req.created_at,
                'responded_at': req.responded_at,
                'direction': 'incoming'  # Add direction indicator
            })
        
        return Response(requests_data)

class ProposalViewSet(viewsets.ModelViewSet):
    serializer_class = ProposalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'customer':
            # Customers can see their own proposals
            return Proposal.objects.filter(customer=user)
        elif user.role == 'manufacturer':
            # Manufacturers can see all active proposals
            return Proposal.objects.filter(is_active=True)
        return Proposal.objects.none()

    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)

    def perform_update(self, serializer):
        # Only allow customers to update their own proposals
        if serializer.instance.customer != self.request.user:
            raise PermissionDenied("You can only edit your own proposals")
        serializer.save()


class ProposalResponseViewSet(viewsets.ModelViewSet):
    serializer_class = ProposalResponseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'manufacturer':
            # Manufacturers can see their own responses
            return ProposalResponse.objects.filter(manufacturer=user)
        elif user.role == 'customer':
            # Customers can see responses to their proposals
            return ProposalResponse.objects.filter(proposal__customer=user)
        return ProposalResponse.objects.none()

    def perform_create(self, serializer):
        # Only manufacturers can create responses
        if self.request.user.role != 'manufacturer':
            raise PermissionDenied("Only manufacturers can respond to proposals")
        serializer.save(manufacturer=self.request.user)


class CustomerProposalListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get proposals for a specific business"""
        business_id = request.query_params.get('business')
        if not business_id:
            return Response({'error': 'Business ID is required'}, status=400)

        try:
            business = Business.objects.get(id=business_id, owner=request.user)
        except Business.DoesNotExist:
            return Response({'error': 'Business not found'}, status=404)

        proposals = Proposal.objects.filter(business=business)
        serializer = ProposalSerializer(proposals, many=True)
        return Response(serializer.data)


class ManufacturerProposalDiscoveryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get all active proposals for manufacturers to browse"""
        if request.user.role != 'manufacturer':
            return Response({'error': 'Access denied'}, status=403)

        proposals = Proposal.objects.filter(is_active=True)
        
        # Apply filters
        category = request.query_params.get('category')
        if category:
            proposals = proposals.filter(category__icontains=category)

        search = request.query_params.get('search')
        if search:
            proposals = proposals.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(business__name__icontains=search)
            )

        # Add information about whether current manufacturer has responded
        proposals_data = []
        for proposal in proposals:
            proposal_data = ProposalSerializer(proposal).data
            # Check if current manufacturer has already responded
            has_responded = ProposalResponse.objects.filter(
                proposal=proposal,
                manufacturer=request.user
            ).exists()
            proposal_data['has_responded'] = has_responded
            proposals_data.append(proposal_data)
        
        return Response(proposals_data)


class ProposalResponseManagementView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, proposal_id):
        """Get responses for a specific proposal"""
        try:
            proposal = Proposal.objects.get(id=proposal_id)
            if proposal.customer != request.user:
                return Response({'error': 'Access denied'}, status=403)
        except Proposal.DoesNotExist:
            return Response({'error': 'Proposal not found'}, status=404)

        responses = ProposalResponse.objects.filter(proposal=proposal)
        serializer = ProposalResponseSerializer(responses, many=True)
        return Response(serializer.data)

    def patch(self, request, proposal_id, response_id):
        """Accept or reject a proposal response"""
        try:
            response = ProposalResponse.objects.get(id=response_id, proposal_id=proposal_id)
            if response.proposal.customer != request.user:
                return Response({'error': 'Access denied'}, status=403)
        except ProposalResponse.DoesNotExist:
            return Response({'error': 'Response not found'}, status=404)

        action = request.data.get('action')
        if action not in ['accept', 'reject']:
            return Response({'error': 'Invalid action'}, status=400)

        response.status = 'accepted' if action == 'accept' else 'rejected'
        response.save()

        # Send email notification to manufacturer
        try:
            send_proposal_response_status_email(response)
        except Exception as e:
            print(f"Failed to send email notification: {e}")

        serializer = ProposalResponseSerializer(response)
        return Response({
            'message': f'Response {action}ed successfully',
            'response': serializer.data
        })


def send_proposal_response_status_email(response):
    """Send email notification when proposal response status changes"""
    subject = f'Proposal Response {response.status.title()}'
    
    if response.status == 'accepted':
        message = f"""
Hello {response.manufacturer.get_full_name()},

Great news! Your response to the proposal "{response.proposal.title}" has been accepted by {response.proposal.customer.get_full_name()}.

You can now start communicating with the customer to discuss the details.

Best regards,
ManageFlow Team
        """
    else:
        message = f"""
Hello {response.manufacturer.get_full_name()},

Your response to the proposal "{response.proposal.title}" was not selected at this time.

Don't worry, there are many other opportunities available. Keep browsing proposals and responding to those that match your capabilities.

Best regards,
ManageFlow Team
        """

    try:
        send_mail(
            subject,
            message,
            'noreply@manageflow.com',
            [response.manufacturer.email],
            fail_silently=False,
        )
    except Exception as e:
        print(f"Failed to send email: {e}")


class CustomerManufacturerDiscoveryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get all manufacturers for customers to discover"""
        if request.user.role != 'customer':
            return Response({'error': 'Access denied'}, status=403)

        # Get all users with manufacturer role
        manufacturers = User.objects.filter(role='manufacturer')
        
        # Apply filters
        location = request.query_params.get('location')
        if location:
            manufacturers = manufacturers.filter(location__icontains=location)

        search = request.query_params.get('search')
        if search:
            manufacturers = manufacturers.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(company_name__icontains=search)
            )

        # Serialize manufacturer data
        manufacturers_data = []
        for manufacturer in manufacturers:
            manufacturer_data = {
                'id': manufacturer.id,
                'get_full_name': manufacturer.get_full_name(),
                'email': manufacturer.email,
                'phone': manufacturer.phone,
                'company_name': manufacturer.company_name,
                'location': manufacturer.location,
                'description': manufacturer.description,
            }
            manufacturers_data.append(manufacturer_data)
        
        return Response(manufacturers_data)


# =============================================================================
# CHAT VIEWS
# =============================================================================

class ChatRoomViewSet(viewsets.ModelViewSet):
    """
    Chat Room ViewSet
    ---------------
    Handles CRUD operations for chat rooms.
    Messages are stored in database with automatic cleanup after 30 days.
    """
    serializer_class = ChatRoomSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'customer':
            return ChatRoom.objects.filter(
                customer=user, 
                is_active=True
            )
        elif user.role == 'manufacturer':
            return ChatRoom.objects.filter(
                manufacturer=user, 
                is_active=True
            )
        return ChatRoom.objects.none()

    def get_serializer_class(self):
        """Use detail serializer for retrieve action"""
        if self.action == 'retrieve':
            return ChatRoomDetailSerializer
        return ChatRoomSerializer

    def retrieve(self, request, *args, **kwargs):
        """Retrieve chat room and mark unread messages as read"""
        instance = self.get_object()
        user = request.user
        
        # Mark unread messages as read for the current user
        unread_messages = instance.messages.filter(
            is_read=False
        ).exclude(sender=user)
        unread_messages.update(is_read=True)
        
        # Serialize the response
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """Send a message using database"""
        try:
            chat_room = self.get_object()
            message = request.data.get('message', '').strip()
            
            if not message:
                return Response({'error': 'Message cannot be empty'}, status=400)
            
            # Save message to database
            chat_message = ChatMessage.objects.create(
                chat_room=chat_room,
                sender=request.user,
                message=message
            )
            
            serializer = ChatMessageSerializer(chat_message)
            return Response({
                'message': 'Message sent successfully',
                'message_data': serializer.data
            })
        except Exception as e:
            return Response({'error': str(e)}, status=400)

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get messages from database"""
        try:
            chat_room = self.get_object()
            limit = int(request.query_params.get('limit', 50))
            offset = int(request.query_params.get('offset', 0))
            
            messages = chat_room.messages.all()[offset:offset + limit]
            serializer = ChatMessageSerializer(messages, many=True)
            
            return Response({
                'messages': serializer.data,
                'chat_room_id': chat_room.id
            })
        except Exception as e:
            return Response({'error': str(e)}, status=400)

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark messages as read"""
        try:
            chat_room = self.get_object()
            user = request.user
            
            # Mark unread messages as read
            unread_messages = chat_room.messages.filter(
                is_read=False
            ).exclude(sender=user)
            unread_messages.update(is_read=True)
            
            return Response({'message': 'Messages marked as read'})
        except Exception as e:
            return Response({'error': str(e)}, status=400)

    @action(detail=True, methods=['post'])
    def delete_for_user(self, request, pk=None):
        """Permanently delete chat room and all messages"""
        try:
            chat_room = self.get_object()
            user = request.user
            
            # Delete all messages in the chat room first
            deleted_messages_count, _ = chat_room.messages.all().delete()
            
            # Delete the chat room itself
            chat_room.delete()
            
            return Response({
                'message': 'Chat deleted successfully',
                'deleted_messages': deleted_messages_count
            })
        except Exception as e:
            return Response({'error': str(e)}, status=400)

    @action(detail=True, methods=['post'])
    def delete_messages(self, request, pk=None):
        """Delete all messages from chat room"""
        try:
            chat_room = self.get_object()
            deleted_count, _ = chat_room.messages.all().delete()
            
            return Response({
                'message': f'All messages deleted ({deleted_count} messages)'
            })
        except Exception as e:
            return Response({'error': str(e)}, status=400)

    @action(detail=False, methods=['get'])
    def get_or_create_for_request(self, request):
        """Get or create chat room for a manufacturer request"""
        try:
            request_id = request.query_params.get('request_id')
            if not request_id:
                return Response({'error': 'request_id is required'}, status=400)
            
            manufacturer_request = ManufacturerRequest.objects.get(id=request_id)
            user = request.user
            
            # Check if user is involved in this request
            if user not in [manufacturer_request.customer, manufacturer_request.manufacturer]:
                return Response({'error': 'Access denied'}, status=403)
            
            # Get or create chat room
            chat_room, created = ChatRoom.objects.get_or_create(
                customer=manufacturer_request.customer,
                manufacturer=manufacturer_request.manufacturer,
                request=manufacturer_request,
                defaults={'is_active': True}
            )
            
            # Get unread count
            unread_count = chat_room.messages.filter(
                is_read=False
            ).exclude(sender=user).count()
            
            serializer = self.get_serializer(chat_room)
            data = serializer.data
            data['unread_count'] = unread_count
            data['created'] = created
            
            return Response(data)
        except ManufacturerRequest.DoesNotExist:
            return Response({'error': 'Manufacturer request not found'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=400)

    @action(detail=False, methods=['post'])
    def create_from_request(self, request):
        """Create chat room from rejected manufacturer request"""
        try:
            request_id = request.data.get('request_id')
            if not request_id:
                return Response({'error': 'request_id is required'}, status=400)
            
            manufacturer_request = ManufacturerRequest.objects.get(id=request_id)
            user = request.user
            
            # Check if user is the customer of this request
            if user != manufacturer_request.customer:
                return Response({'error': 'Access denied'}, status=403)
            
            # Get or create chat room
            chat_room, created = ChatRoom.objects.get_or_create(
                customer=manufacturer_request.customer,
                manufacturer=manufacturer_request.manufacturer,
                request=manufacturer_request,
                defaults={'is_active': True}
            )
            
            serializer = self.get_serializer(chat_room)
            data = serializer.data
            data['created'] = created
            
            return Response(data)
        except ManufacturerRequest.DoesNotExist:
            return Response({'error': 'Manufacturer request not found'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=400)

    @action(detail=False, methods=['get'])
    def get_business_info(self, request):
        """Get business information for approved request"""
        try:
            request_id = request.query_params.get('request_id')
            if not request_id:
                return Response({'error': 'request_id is required'}, status=400)
            
            manufacturer_request = ManufacturerRequest.objects.get(id=request_id)
            user = request.user
            
            # Check if user is the manufacturer of this request
            if user != manufacturer_request.manufacturer:
                return Response({'error': 'Access denied'}, status=403)
            
            if manufacturer_request.status != 'approved':
                return Response({'error': 'Request must be approved first'}, status=400)
            
            return Response({
                'business_name': manufacturer_request.business.name,
                'business_id': manufacturer_request.business.id,
                'customer_name': f"{manufacturer_request.customer.first_name} {manufacturer_request.customer.last_name}".strip(),
                'customer_email': manufacturer_request.customer.email,
                'message': f"Contact {manufacturer_request.customer.first_name} {manufacturer_request.customer.last_name} for the invite code to join {manufacturer_request.business.name}"
            })
        except ManufacturerRequest.DoesNotExist:
            return Response({'error': 'Manufacturer request not found'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=400)

    @action(detail=False, methods=['get'])
    def get_or_create_for_proposal_response(self, request):
        """Get or create chat room for a proposal response"""
        try:
            response_id = request.query_params.get('response_id')
            if not response_id:
                return Response({'error': 'response_id is required'}, status=400)
            
            proposal_response = ProposalResponse.objects.get(id=response_id)
            user = request.user
            
            # Check if user is involved in this proposal response
            if user not in [proposal_response.proposal.customer, proposal_response.manufacturer]:
                return Response({'error': 'Access denied'}, status=403)
            
            # Check if the proposal response is accepted
            if proposal_response.status != 'accepted':
                return Response({'error': 'Can only create chat for accepted proposal responses'}, status=400)
            
            # Get or create chat room
            chat_room, created = ChatRoom.objects.get_or_create(
                customer=proposal_response.proposal.customer,
                manufacturer=proposal_response.manufacturer,
                proposal_response=proposal_response,
                defaults={'is_active': True}
            )
            
            # Get unread count
            unread_count = chat_room.messages.filter(
                is_read=False
            ).exclude(sender=user).count()
            
            serializer = self.get_serializer(chat_room)
            data = serializer.data
            data['unread_count'] = unread_count
            data['created'] = created
            
            return Response(data)
        except ProposalResponse.DoesNotExist:
            return Response({'error': 'Proposal response not found'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=400)

    @action(detail=False, methods=['get'])
    def get_or_create_for_business(self, request):
        """Get or create chat room for a business relationship"""
        try:
            business_id = request.query_params.get('business_id')
            if not business_id:
                return Response({'error': 'business_id is required'}, status=400)
            
            business = Business.objects.get(id=business_id)
            user = request.user
            
            # Check if user is the manufacturer of this business
            if user != business.manufacturer:
                return Response({'error': 'Access denied. Only the business manufacturer can create this chat.'}, status=403)
            
            # Check if business has an owner (customer)
            if not business.owner:
                return Response({'error': 'Business has no owner to chat with.'}, status=400)
            
            # Get or create chat room
            chat_room, created = ChatRoom.objects.get_or_create(
                customer=business.owner,
                manufacturer=user,
                business=business,
                defaults={'is_active': True}
            )
            
            # Get unread count
            unread_count = chat_room.messages.filter(
                is_read=False
            ).exclude(sender=user).count()
            
            serializer = self.get_serializer(chat_room)
            data = serializer.data
            data['unread_count'] = unread_count
            data['created'] = created
            
            return Response(data)
        except Business.DoesNotExist:
            return Response({'error': 'Business not found'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=400)


class ChatMessageViewSet(viewsets.ModelViewSet):
    """
    Chat Message ViewSet
    -------------------
    Handles CRUD operations for chat messages.
    Users can only access messages in their chat rooms.
    """
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter messages by user's chat rooms"""
        user = self.request.user
        chat_room_id = self.request.query_params.get('chat_room_id') or self.request.data.get('chat_room')
        
        if chat_room_id:
            # Check if user has access to this chat room
            try:
                chat_room = ChatRoom.objects.get(id=chat_room_id)
                if user in [chat_room.customer, chat_room.manufacturer]:
                    return ChatMessage.objects.filter(chat_room=chat_room)
            except ChatRoom.DoesNotExist:
                pass
        
        # If no chat room specified, return all messages from user's chat rooms
        if user.role == 'customer':
            return ChatMessage.objects.filter(chat_room__customer=user)
        elif user.role == 'manufacturer':
            return ChatMessage.objects.filter(chat_room__manufacturer=user)
        
        return ChatMessage.objects.none()
    
    def perform_create(self, serializer):
        """Set the sender and validate chat room access"""
        user = self.request.user
        chat_room_id = self.request.data.get('chat_room')
        
        if not chat_room_id:
            raise ValidationError("chat_room is required")
        
        try:
            chat_room = ChatRoom.objects.get(id=chat_room_id)
            if user not in [chat_room.customer, chat_room.manufacturer]:
                raise PermissionDenied("You don't have access to this chat room")
            
            serializer.save(sender=user, chat_room=chat_room)
        except ChatRoom.DoesNotExist:
            raise ValidationError("Chat room not found")
    
    @action(detail=True, methods=['patch'])
    def mark_as_read(self, request, pk=None):
        """Mark a message as read"""
        try:
            message = self.get_object()
            message.mark_as_read()
            return Response({'status': 'Message marked as read'})
        except Exception as e:
            return Response({'error': str(e)}, status=400)


class ChatNotificationView(APIView):
    """
    Chat Notification View
    ----------------------
    Provides unread message counts and notifications for users.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get unread message counts for user's chat rooms"""
        user = request.user
        
        if user.role == 'customer':
            chat_rooms = ChatRoom.objects.filter(customer=user, is_active=True)
        elif user.role == 'manufacturer':
            chat_rooms = ChatRoom.objects.filter(manufacturer=user, is_active=True)
        else:
            return Response({'total_unread': 0, 'chat_rooms': []})
        
        total_unread = 0
        chat_rooms_data = []
        
        for chat_room in chat_rooms:
            unread_count = chat_room.unread_count_customer if user == chat_room.customer else chat_room.unread_count_manufacturer
            total_unread += unread_count
            
            chat_rooms_data.append({
                'chat_room_id': chat_room.id,
                'unread_count': unread_count,
                'last_message': chat_room.messages.last().message[:50] + '...' if chat_room.messages.exists() else None
            })
        
        return Response({
            'total_unread': total_unread,
            'chat_rooms': chat_rooms_data
        })


class ApprovedCustomersView(APIView):
    """
    Approved Customers View
    ----------------------
    Provides list of customers who have approved the manufacturer's requests
    OR customers whose businesses the manufacturer has joined.
    Used for creating new chat rooms.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get customers who have approved the manufacturer's requests OR whose businesses the manufacturer has joined"""
        user = request.user
        
        if user.role != 'manufacturer':
            return Response({'error': 'Access denied. Only manufacturers can view approved customers.'}, status=403)
        
        try:
            customers_data = {}
            
            # 1. Get customers from approved contact requests
            try:
                approved_requests = ManufacturerRequest.objects.filter(
                    manufacturer=user,
                    status='approved'
                ).select_related('customer', 'business').order_by('-created_at')
                
                for request in approved_requests:
                    customer_id = request.customer.id
                    
                    if customer_id not in customers_data:
                        customers_data[customer_id] = {
                            'id': request.customer.id,
                            'name': request.customer.get_full_name() or request.customer.username,
                            'business_name': request.business.name if request.business else 'No Business',
                            'business_id': request.business.id if request.business else None,
                            'approved_requests': [],
                            'business_relationships': [],
                            'total_requests': 0,
                            'has_business_relationship': False
                        }
                    
                    # Check if chat room already exists for this request
                    chat_exists = ChatRoom.objects.filter(
                        customer=request.customer,
                        manufacturer=user,
                        request=request
                    ).exists()
                    
                    customers_data[customer_id]['approved_requests'].append({
                        'id': request.id,
                        'title': request.message[:50] + '...' if len(request.message) > 50 else request.message,
                        'created_at': request.created_at.isoformat(),
                        'chat_exists': chat_exists,
                        'type': 'contact_request'
                    })
                    customers_data[customer_id]['total_requests'] += 1
            except Exception as e:
                print(f"Error processing approved requests: {e}")
                return Response({'error': f'Error processing approved requests: {str(e)}'}, status=400)
            
            # 2. Get customers from business relationships (manufacturer has joined their businesses)
            try:
                joined_businesses = Business.objects.filter(manufacturer=user).select_related('owner')
                
                for business in joined_businesses:
                    if business.owner:
                        customer_id = business.owner.id
                        
                        if customer_id not in customers_data:
                            customers_data[customer_id] = {
                                'id': business.owner.id,
                                'name': business.owner.get_full_name() or business.owner.username,
                                'business_name': business.name,
                                'business_id': business.id,
                                'approved_requests': [],
                                'business_relationships': [],
                                'total_requests': 0,
                                'has_business_relationship': True
                            }
                        else:
                            # Update existing customer data
                            customers_data[customer_id]['business_name'] = business.name
                            customers_data[customer_id]['business_id'] = business.id
                            customers_data[customer_id]['has_business_relationship'] = True
                        
                        # Check if chat room already exists for this business relationship
                        chat_exists = ChatRoom.objects.filter(
                            customer=business.owner,
                            manufacturer=user,
                            business=business
                        ).exists()
                        
                        customers_data[customer_id]['business_relationships'].append({
                            'id': business.id,
                            'title': f"Business: {business.name}",
                            'created_at': timezone.now().isoformat(),
                            'chat_exists': chat_exists,
                            'type': 'business_relationship'
                        })
                        customers_data[customer_id]['total_requests'] += 1
            except Exception as e:
                print(f"Error processing business relationships: {e}")
                return Response({'error': f'Error processing business relationships: {str(e)}'}, status=400)
            
            # Convert to list and limit requests to 3 per customer
            customers_list = []
            for customer_data in customers_data.values():
                # Combine and sort all relationships by date (newest first) and limit to 3
                all_relationships = (
                    customer_data['approved_requests'] + 
                    customer_data['business_relationships']
                )
                sorted_relationships = sorted(
                    all_relationships, 
                    key=lambda x: x['created_at'], 
                    reverse=True
                )[:3]
                
                customers_list.append({
                    **customer_data,
                    'approved_requests': sorted_relationships
                })
            
            return Response({
                'customers': customers_list
            })
            
        except Exception as e:
            print(f"General error in ApprovedCustomersView: {e}")
            return Response({'error': str(e)}, status=400)


class ApprovedManufacturersView(APIView):
    """
    Approved Manufacturers View
    --------------------------
    Provides list of manufacturers who have approved the customer's requests
    OR manufacturers who have joined the customer's businesses.
    Used for creating new chat rooms.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get manufacturers who have approved the customer's requests OR have joined the customer's businesses"""
        user = request.user
        
        if user.role != 'customer':
            return Response({'error': 'Access denied. Only customers can view approved manufacturers.'}, status=403)
        
        try:
            manufacturers_data = {}
            
            # 1. Get manufacturers from approved contact requests
            approved_requests = ManufacturerRequest.objects.filter(
                customer=user,
                status='approved'
            ).select_related('manufacturer', 'business').order_by('-created_at')
            
            for request in approved_requests:
                manufacturer_id = request.manufacturer.id
                
                if manufacturer_id not in manufacturers_data:
                    manufacturers_data[manufacturer_id] = {
                        'id': request.manufacturer.id,
                        'name': request.manufacturer.get_full_name() or request.manufacturer.username,
                        'company_name': request.manufacturer.company_name or 'No Company',
                        'location': request.manufacturer.location or 'Location not set',
                        'approved_requests': [],
                        'business_relationships': [],
                        'total_requests': 0,
                        'has_business_relationship': False
                    }
                
                # Check if chat room already exists for this request
                chat_exists = ChatRoom.objects.filter(
                    customer=user,
                    manufacturer=request.manufacturer,
                    request=request
                ).exists()
                
                manufacturers_data[manufacturer_id]['approved_requests'].append({
                    'id': request.id,
                    'title': request.message[:50] + '...' if len(request.message) > 50 else request.message,
                    'created_at': request.created_at.isoformat(),
                    'chat_exists': chat_exists,
                    'type': 'contact_request'
                })
                manufacturers_data[manufacturer_id]['total_requests'] += 1
            
            # 2. Get manufacturers from business relationships (manufacturers who have joined the customer's businesses)
            owned_businesses = Business.objects.filter(owner=user).select_related('manufacturer')
            
            for business in owned_businesses:
                if business.manufacturer:
                    manufacturer_id = business.manufacturer.id
                    
                    if manufacturer_id not in manufacturers_data:
                        manufacturers_data[manufacturer_id] = {
                            'id': business.manufacturer.id,
                            'name': business.manufacturer.get_full_name() or business.manufacturer.username,
                            'company_name': business.manufacturer.company_name or 'No Company',
                            'location': business.manufacturer.location or 'Location not set',
                            'approved_requests': [],
                            'business_relationships': [],
                            'total_requests': 0,
                            'has_business_relationship': True
                        }
                    else:
                        # Update existing manufacturer data
                        manufacturers_data[manufacturer_id]['has_business_relationship'] = True
                    
                    # Check if chat room already exists for this business relationship
                    chat_exists = ChatRoom.objects.filter(
                        customer=user,
                        manufacturer=business.manufacturer,
                        business=business
                    ).exists()
                    
                    manufacturers_data[manufacturer_id]['business_relationships'].append({
                        'id': business.id,
                        'title': f"Business: {business.name}",
                        'created_at': timezone.now().isoformat(),
                        'chat_exists': chat_exists,
                        'type': 'business_relationship'
                    })
                    manufacturers_data[manufacturer_id]['total_requests'] += 1
            
            # Convert to list and limit requests to 3 per manufacturer
            manufacturers_list = []
            for manufacturer_data in manufacturers_data.values():
                # Combine and sort all relationships by date (newest first) and limit to 3
                all_relationships = (
                    manufacturer_data['approved_requests'] + 
                    manufacturer_data['business_relationships']
                )
                sorted_relationships = sorted(
                    all_relationships, 
                    key=lambda x: x['created_at'], 
                    reverse=True
                )[:3]
                
                manufacturers_list.append({
                    **manufacturer_data,
                    'approved_requests': sorted_relationships
                })
            
            return Response({
                'manufacturers': manufacturers_list
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=400)


class JoinBusinessView(APIView):
    """
    Join Business View
    -----------------
    Allows manufacturers to join a customer's business using an invite code.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Join a business using invite code"""
        user = request.user
        
        if user.role != 'manufacturer':
            return Response({'error': 'Access denied. Only manufacturers can join businesses.'}, status=403)
        
        invite_code = request.data.get('invite_code')
        if not invite_code:
            return Response({'error': 'Invite code is required.'}, status=400)
        
        try:
            # Find the business with the given invite code
            business = Business.objects.get(invite_code=invite_code)
            
            # Check if manufacturer is already associated with this business
            if business.manufacturer == user:
                return Response({'error': 'You are already the manufacturer for this business.'}, status=400)
            
            # Check if manufacturer is in pending or rejected list
            if business.pending_manufacturers.filter(id=user.id).exists():
                return Response({'error': 'You have already requested to join this business. Please wait for approval.'}, status=400)
            
            if business.rejected_manufacturers.filter(id=user.id).exists():
                return Response({'error': 'Your request to join this business was previously rejected.'}, status=400)
            
            # Add manufacturer to pending list
            business.pending_manufacturers.add(user)
            business.save()
            
            # Send notification email to business owner
            try:
                send_mail(
                    subject=f'New Manufacturer Request - {business.name}',
                    message=f'''
                    A manufacturer has requested to join your business "{business.name}".
                    
                    Manufacturer Details:
                    - Name: {user.get_full_name() or user.username}
                    - Email: {user.email}
                    - Company: {user.company_name or 'Not specified'}
                    - Location: {user.location or 'Not specified'}
                    
                    Please review and approve/reject this request in your dashboard.
                    ''',
                    from_email=None,  # Use default from settings
                    recipient_list=[business.owner.email],
                    fail_silently=True
                )
            except Exception as e:
                print(f"Failed to send email notification: {e}")
            
            return Response({
                'message': 'Request to join business sent successfully. Please wait for customer approval.',
                'business_name': business.name,
                'business_owner': business.owner.get_full_name() or business.owner.username
            })
            
        except Business.DoesNotExist:
            return Response({'error': 'Invalid invite code. Please check the code and try again.'}, status=400)
        except Exception as e:
            return Response({'error': str(e)}, status=400) 


class ManufacturerIncomingRequestDetailView(APIView):
    """
    Manufacturer Incoming Request Detail View - Get specific incoming request details
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, request_id):
        user = request.user
        if user.role != "manufacturer":
            return Response({"detail": "Only manufacturers can access this endpoint."}, status=403)
        
        try:
            req = ManufacturerRequest.objects.select_related('customer', 'business').get(
                id=request_id,
                business__manufacturer=user,  # Request for this manufacturer's business
                business__owner__isnull=False  # Ensure it's from a customer
            )
        except ManufacturerRequest.DoesNotExist:
            return Response({"detail": "Request not found."}, status=404)
        
        request_data = {
            'id': req.id,
            'request_type': req.request_type,
            'status': req.status,
            'business_name': req.business.name,
            'business_id': req.business.id,
            'business_slogan': req.business.slogan,
            'customer_name': f"{req.customer.first_name} {req.customer.last_name}".strip(),
            'customer_email': req.customer.email,
            'customer_location': req.customer.location,
            'manufacturer_name': req.manufacturer_name,
            'manufacturer_email': req.manufacturer_email,
            'manufacturer_company': req.manufacturer_company,
            'manufacturer_phone': req.manufacturer_phone,
            'message': req.message,
            'customer_response': req.customer_response,
            'customer_notes': req.customer_notes,
            'created_at': req.created_at,
            'responded_at': req.responded_at,
            'direction': 'incoming'
        }
        
        return Response(request_data)