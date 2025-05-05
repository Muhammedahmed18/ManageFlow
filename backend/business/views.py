from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Business
from .serializers import BusinessSerializer
from rest_framework.pagination import PageNumberPagination

# ✅ Pagination class
class CustomPagination(PageNumberPagination):
    page_size = 3  # You can change this as needed

# ✅ Business List and Create
class BusinessView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'manufacturer':
            return Response({"error": "Only manufacturers can view their businesses."}, status=403)

        businesses = Business.objects.filter(manufacturer=request.user).order_by("id")

        paginator = CustomPagination()
        result_page = paginator.paginate_queryset(businesses, request)
        serializer = BusinessSerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        if request.user.role != 'manufacturer':
            return Response({"error": "Only manufacturers can create businesses."}, status=403)

        serializer = BusinessSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(manufacturer=request.user)
            return Response(serializer.data, status=201)

        return Response(serializer.errors, status=400)

# ✅ Business Detail View
class BusinessDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, id):
        try:
            business = Business.objects.get(id=id, manufacturer=request.user)
            serializer = BusinessSerializer(business)
            return Response(serializer.data, status=200)
        except Business.DoesNotExist:
            return Response({"error": "Business not found."}, status=404)

    def put(self, request, id):
        try:
            business = Business.objects.get(id=id, manufacturer=request.user)
            serializer = BusinessSerializer(business, data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=200)
            return Response(serializer.errors, status=400)
        except Business.DoesNotExist:
            return Response({"error": "Business not found."}, status=404)

    def delete(self, request, id):
        try:
            business = Business.objects.get(id=id, manufacturer=request.user)
            business.delete()
            return Response({"message": "Business deleted successfully."}, status=204)
        except Business.DoesNotExist:
            return Response({"error": "Business not found."}, status=404)
