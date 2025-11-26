"""
Admin mixins for handling authentication checks
Place this in: users/admin_mixins.py
"""

class AuthenticatedPermissionMixin:
    """
    Mixin that ensures all permission checks verify user authentication first.
    This prevents AttributeError when AnonymousUser tries to access custom user methods.
    """
    
    def has_add_permission(self, request):
        if not request.user.is_authenticated:
            return False
        return super().has_add_permission(request)
    
    def has_change_permission(self, request, obj=None):
        if not request.user.is_authenticated:
            return False
        return super().has_change_permission(request, obj)
    
    def has_delete_permission(self, request, obj=None):
        if not request.user.is_authenticated:
            return False
        return super().has_delete_permission(request, obj)
    
    def has_module_permission(self, request):
        if not request.user.is_authenticated:
            return False
        return super().has_module_permission(request)
    
    def has_view_permission(self, request, obj=None):
        if not request.user.is_authenticated:
            return False
        return super().has_view_permission(request, obj)