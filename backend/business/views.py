from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Business
from .serializers import BusinessSerializer
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Business
from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()

# ✅ Pagination class
class CustomPagination(PageNumberPagination):
    page_size = 3  # You can change this as needed

# ✅ Business List and Create
class BusinessView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'manufacturer':
            return Response({"error": "Only manufacturers can view their businesses."}, status=403)

        # Return businesses where the user is either the approved manufacturer, pending manufacturer, or rejected manufacturer
        businesses = Business.objects.filter(
            models.Q(manufacturer=request.user) | 
            models.Q(pending_manufacturers=request.user) | 
            models.Q(rejected_manufacturers=request.user)
        ).order_by("id")

        paginator = CustomPagination()
        result_page = paginator.paginate_queryset(businesses, request)
        serializer = BusinessSerializer(result_page, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        if request.user.role != 'manufacturer':
            return Response({"error": "Only manufacturers can create businesses."}, status=403)

        serializer = BusinessSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(manufacturer=request.user)
            return Response(serializer.data, status=201)

        return Response(serializer.errors, status=400)

# ✅ Business Detail View
class BusinessDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, id):
        try:
            business = Business.objects.get(
                models.Q(id=id, manufacturer=request.user) | 
                models.Q(id=id, pending_manufacturers=request.user) | 
                models.Q(id=id, rejected_manufacturers=request.user)
            )
            serializer = BusinessSerializer(business, context={'request': request})
            return Response(serializer.data, status=200)
        except Business.DoesNotExist:
            return Response({"error": "Business not found."}, status=404)

    def put(self, request, id):
        try:
            business = Business.objects.get(
                models.Q(id=id, manufacturer=request.user) | 
                models.Q(id=id, pending_manufacturers=request.user) | 
                models.Q(id=id, rejected_manufacturers=request.user)
            )
            serializer = BusinessSerializer(business, data=request.data, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=200)
            return Response(serializer.errors, status=400)
        except Business.DoesNotExist:
            return Response({"error": "Business not found."}, status=404)

    def delete(self, request, id):
        try:
            business = Business.objects.get(
                models.Q(id=id, manufacturer=request.user) | 
                models.Q(id=id, pending_manufacturers=request.user) | 
                models.Q(id=id, rejected_manufacturers=request.user)
            )
            business.delete()
            return Response({"message": "Business deleted successfully."}, status=204)
        except Business.DoesNotExist:
            return Response({"error": "Business not found."}, status=404)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def link_business(request):
    invite_code = request.data.get('invite_code')
    try:
        business = Business.objects.get(invite_code=invite_code)
        business.pending_manufacturers.add(request.user)
        return Response({
            'detail': 'Request sent. Awaiting customer approval.',
            'business': business.name,
            'business_id': business.id
        })
    except Business.DoesNotExist:
        return Response({'detail': 'Invalid invite code.'}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_requests(request):
    businesses = Business.objects.filter(owner=request.user, pending_manufacturers__isnull=False)
    return Response({'pending': [
        {
            'business_id': b.id,
            'business_name': b.name,
            'pending_manufacturers': [
                {'id': u.id, 'username': u.username, 'email': u.email}
                for u in b.pending_manufacturers.all()
            ]
        }
        for b in businesses
    ]})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_manufacturer(request):
    business_id = request.data.get('business_id')
    manufacturer_id = request.data.get('manufacturer_id')
    try:
        business = Business.objects.get(id=business_id, owner=request.user)
        manufacturer = User.objects.get(id=manufacturer_id)
        
        # Handle approving pending manufacturers
        if manufacturer in business.pending_manufacturers.all():
            business.manufacturer = manufacturer
            business.pending_manufacturers.remove(manufacturer)
            business.save()
            return Response({'detail': 'Manufacturer approved.'})
        
        # Handle restoring access for rejected manufacturers
        elif manufacturer in business.rejected_manufacturers.all():
            business.manufacturer = manufacturer
            business.rejected_manufacturers.remove(manufacturer)
            business.save()
            return Response({'detail': 'Manufacturer access restored.'})
        else:
            return Response({'detail': 'No such pending or rejected request.'}, status=400)
    except (Business.DoesNotExist, User.DoesNotExist):
        return Response({'detail': 'Invalid business or manufacturer.'}, status=404)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_manufacturer(request):
    business_id = request.data.get('business_id')
    manufacturer_id = request.data.get('manufacturer_id')

    try:
        business = Business.objects.get(id=business_id, owner=request.user)
        manufacturer = User.objects.get(id=manufacturer_id)

        # Handle rejecting pending manufacturers
        if manufacturer in business.pending_manufacturers.all():
            business.pending_manufacturers.remove(manufacturer)
            business.rejected_manufacturers.add(manufacturer)
            business.save()
            return Response({'detail': 'Manufacturer rejected.'})
        
        # Handle revoking access from approved manufacturers
        elif business.manufacturer == manufacturer:
            business.manufacturer = None
            business.rejected_manufacturers.add(manufacturer)
            business.save()
            return Response({'detail': 'Manufacturer access revoked.'})
        else:
            return Response({'detail': 'Manufacturer is not associated with this business.'}, status=400)

    except (Business.DoesNotExist, User.DoesNotExist):
        return Response({'detail': 'Invalid business or manufacturer.'}, status=404)

class CustomerBusinessDetail(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, id):
        try:
            business = Business.objects.get(id=id, owner=request.user)
            serializer = BusinessSerializer(business)
            return Response(serializer.data, status=200)
        except Business.DoesNotExist:
            return Response({"error": "Business not found."}, status=404)

class CustomerBusinessVisibilityView(APIView):
    """
    Customer Business Visibility Management
    Allows customers to toggle visibility of their businesses in manufacturer discovery
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get all customer's businesses with visibility status"""
        if request.user.role != 'customer':
            return Response({"error": "Only customers can access this endpoint."}, status=403)
        
        businesses = Business.objects.filter(owner=request.user).order_by('-id')
        business_data = []
        
        for business in businesses:
            business_data.append({
                'business_id': business.id,
                'business_name': business.name,
                'is_public': business.is_public,
                'total_products': business.products.count(),
                'location': business.owner.location if business.owner else None,
                'industry': business.industry,
                'description': business.description,
                'created_at': business.created_at
            })
        
        return Response(business_data)

    def patch(self, request, business_id):
        """Toggle business visibility"""
        if request.user.role != 'customer':
            return Response({"error": "Only customers can modify business visibility."}, status=403)
        
        try:
            business = Business.objects.get(id=business_id, owner=request.user)
            is_public = request.data.get('is_public')
            
            if is_public is not None:
                business.is_public = is_public
                business.save()
                
                status_text = "public" if is_public else "private"
                return Response({
                    "message": f"Business '{business.name}' is now {status_text}",
                    "business_id": business.id,
                    "business_name": business.name,
                    "is_public": business.is_public
                })
            else:
                return Response({"error": "is_public field is required."}, status=400)
                
        except Business.DoesNotExist:
            return Response({"error": "Business not found."}, status=404)
