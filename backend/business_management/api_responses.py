"""
Enhanced API Response Structure
==============================
Standardized API response format with metadata and pagination.
"""

from rest_framework.response import Response
from rest_framework import status
from django.core.paginator import Paginator
from django.db.models import QuerySet
import time

class APIResponseBuilder:
    """
    Build standardized API responses
    """
    
    @staticmethod
    def success_response(data=None, message="Success", status_code=200, metadata=None):
        """
        Create a successful API response
        """
        response_data = {
            "success": True,
            "message": message,
            "data": data,
            "timestamp": time.time(),
            "status_code": status_code
        }
        
        if metadata:
            response_data["metadata"] = metadata
            
        return Response(response_data, status=status_code)
    
    @staticmethod
    def error_response(message="Error", errors=None, status_code=400, metadata=None):
        """
        Create an error API response
        """
        response_data = {
            "success": False,
            "message": message,
            "errors": errors or {},
            "timestamp": time.time(),
            "status_code": status_code
        }
        
        if metadata:
            response_data["metadata"] = metadata
            
        return Response(response_data, status=status_code)
    
    @staticmethod
    def paginated_response(queryset, page=1, page_size=20, serializer_class=None, metadata=None):
        """
        Create a paginated response
        """
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)
        
        if serializer_class:
            data = serializer_class(page_obj.object_list, many=True).data
        else:
            data = list(page_obj.object_list.values())
        
        pagination_metadata = {
            "pagination": {
                "current_page": page_obj.number,
                "total_pages": paginator.num_pages,
                "total_items": paginator.count,
                "page_size": page_size,
                "has_next": page_obj.has_next(),
                "has_previous": page_obj.has_previous(),
                "next_page": page_obj.next_page_number() if page_obj.has_next() else None,
                "previous_page": page_obj.previous_page_number() if page_obj.has_previous() else None,
            }
        }
        
        if metadata:
            pagination_metadata.update(metadata)
        
        return APIResponseBuilder.success_response(
            data=data,
            message="Data retrieved successfully",
            metadata=pagination_metadata
        )

class APIResponse:
    """
    Simple wrapper for APIResponseBuilder to maintain compatibility
    """
    
    @staticmethod
    def success(data=None, message="Success", status_code=200, metadata=None):
        """Create a successful API response"""
        return APIResponseBuilder.success_response(
            data=data, 
            message=message, 
            status_code=status_code, 
            metadata=metadata
        )
    
    @staticmethod
    def error(message="Error", errors=None, status_code=400, metadata=None):
        """Create an error API response"""
        return APIResponseBuilder.error_response(
            message=message, 
            errors=errors, 
            status_code=status_code, 
            metadata=metadata
        )


class BulkOperationResponse:
    """
    Handle bulk operation responses
    """
    
    @staticmethod
    def bulk_create_response(created_count, failed_items=None, total_count=None):
        """
        Response for bulk create operations
        """
        metadata = {
            "operation": "bulk_create",
            "created_count": created_count,
            "total_count": total_count or created_count,
            "success_rate": (created_count / (total_count or created_count)) * 100 if total_count else 100
        }
        
        if failed_items:
            metadata["failed_items"] = failed_items
            metadata["failed_count"] = len(failed_items)
        
        return APIResponseBuilder.success_response(
            data={"created_count": created_count},
            message=f"Successfully created {created_count} items",
            metadata=metadata
        )
    
    @staticmethod
    def bulk_update_response(updated_count, failed_items=None, total_count=None):
        """
        Response for bulk update operations
        """
        metadata = {
            "operation": "bulk_update",
            "updated_count": updated_count,
            "total_count": total_count or updated_count,
            "success_rate": (updated_count / (total_count or updated_count)) * 100 if total_count else 100
        }
        
        if failed_items:
            metadata["failed_items"] = failed_items
            metadata["failed_count"] = len(failed_items)
        
        return APIResponseBuilder.success_response(
            data={"updated_count": updated_count},
            message=f"Successfully updated {updated_count} items",
            metadata=metadata
        )
