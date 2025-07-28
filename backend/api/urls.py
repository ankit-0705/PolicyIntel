from django.urls import path
from .views import signup, login, upload_document, analyze_query, my_queries, get_user_info

urlpatterns = [
    path('signup/', signup),
    path('login/', login),
    path('upload/', upload_document),
    path('analyze/', analyze_query),
    path('my-queries/', my_queries),
    path('user-info/',get_user_info)
]
