from rest_framework import serializers
from .models import Business

class BusinessSerializer(serializers.ModelSerializer):
    class Meta:
        model = Business
        fields = ['id', 'name', 'slogan', 'shipping_country', 'invite_code']
        read_only_fields = ['invite_code']