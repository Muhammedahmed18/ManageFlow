from rest_framework import serializers
from .models import Business

class BusinessSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    
    class Meta:
        model = Business
        fields = ['id', 'name', 'slogan', 'shipping_country', 'invite_code', 'status']
        read_only_fields = ['invite_code', 'status']
    
    def get_status(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        
        user = request.user
        
        # Check if user is the approved manufacturer
        if obj.manufacturer == user:
            return 'approved'
        
        # Check if user is in pending manufacturers
        if user in obj.pending_manufacturers.all():
            return 'pending'
        
        # Check if user is in rejected manufacturers
        if user in obj.rejected_manufacturers.all():
            return 'rejected'
        
        return None