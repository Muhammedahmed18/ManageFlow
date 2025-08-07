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
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import ValidationError
from django.db.models import Q

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
    NumberConfig
)
from .serializers import (
    ProductTemplateSerializer,
    TemplateFieldSerializer,
    ProductSerializer,
    ProductCategorySerializer,

    OrderSerializer,

    BusinessSerializer,
    InvoiceSerializer,
    NumberConfigSerializer
)

from authapp.models import User
from business.models import Business  # Ensure correct model is used

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
        from business.models import Business
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
        business = Business.objects.filter(owner=user).first()
        if not business:
            return Response({"detail": "Customer is not linked to any business"}, status=400)

        orders = Order.objects.filter(customer=user).order_by("-created_at")
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
        """Get orders for manufacturer's businesses"""
        user = request.user
        if user.role != "manufacturer":
            return Response({"detail": "Only manufacturers can access this endpoint."}, status=403)

        # Get all businesses where user is the manufacturer
        businesses = Business.objects.filter(manufacturer=user)
        if not businesses.exists():
            return Response({"detail": "No businesses found for this manufacturer."}, status=404)

        # Get all orders from these businesses
        orders = Order.objects.filter(business__in=businesses).order_by("-created_at")
        
        # Debug: Log order statuses
        print(f"ManufacturerOrderView: Found {orders.count()} orders for manufacturer {user.username}")
        for order in orders:
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
        """Get businesses for manufacturer"""
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
        
        serializer = BusinessSerializer(paginated_businesses, many=True, context={'request': request})
        
        return Response({
            'results': serializer.data,
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
        """Create business with automatic user assignment"""
        if self.request.user.role == 'customer':
            serializer.save(owner=self.request.user)
        else:
            serializer.save(manufacturer=self.request.user)

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


class InvoiceViewSet(viewsets.ModelViewSet):
    """
    Invoice ViewSet
    ---------------
    Handles CRUD operations for invoices with business-specific filtering.
    """
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter invoices by business, user permissions, and status-based visibility"""
        business_id = self.request.query_params.get('business')
        user = self.request.user
        qs = Invoice.objects.all()
        
        if business_id:
            qs = qs.filter(business_id=business_id)
        
        # Apply role-based permissions and status filtering
        if user.role == 'customer':
            customer_business = Business.objects.filter(owner=user).first()
            if customer_business:
                qs = qs.filter(business=customer_business)
                # Customers can only see invoices with status 'pending' or higher
                qs = qs.exclude(status='draft')
                print(f"InvoiceViewSet: Customer {user.username} - Filtered to exclude draft invoices")
            else:
                qs = qs.none()
                print(f"InvoiceViewSet: Customer {user.username} - No business found")
        else:
            # Manufacturer can see invoices from their businesses
            qs = qs.filter(business__manufacturer=user)
            # Manufacturers can see all invoices (including drafts)
            print(f"InvoiceViewSet: Manufacturer {user.username} - Can see all invoices including drafts")
        
        print(f"InvoiceViewSet: Final query count: {qs.count()}")
        return qs.select_related('business', 'order')

    def perform_create(self, serializer):
        """Create invoice with automatic business assignment"""
        user = self.request.user
        if user.role == 'customer':
            business = Business.objects.filter(owner=user).first()
            if not business:
                raise ValidationError("Customer has no associated business")
            serializer.save(business=business)
        else:
            # For manufacturers, business should be provided in request data
            serializer.save()

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
        
        print(f"InvoiceViewSet: Updating invoice {invoice.id} status from {invoice.status} to {new_status}")
        invoice.status = new_status
        invoice.save()
        
        serializer = self.get_serializer(invoice)
        return Response(serializer.data)


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
                             'line_items', 'subtotal', 'sales_tax', 'gross_total',
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
        """Filter number configs by business and user permissions"""
        business_id = self.request.query_params.get('business')
        user = self.request.user
        qs = self.queryset
        
        if business_id:
            qs = qs.filter(business_id=business_id)
        
        # Apply role-based permissions
        if user.role == 'customer':
            customer_business = Business.objects.filter(owner=user).first()
            if customer_business:
                qs = qs.filter(business=customer_business)
            else:
                qs = qs.none()
        else:
            # Manufacturer can see configs from their businesses
            qs = qs.filter(business__manufacturer=user)
        
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