from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate, get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer, UserSerializer, LoginSerializer
from .models import PasswordResetOTP

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request,
            username=serializer.validated_data['email'],
            password=serializer.validated_data['password']
        )
        if not user:
            return Response(
                {'detail': 'Invalid email or password.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        user = request.user
        username   = request.data.get('username',   '').strip()
        email      = request.data.get('email',      '').strip()
        first_name = request.data.get('first_name', '').strip()
        last_name  = request.data.get('last_name',  '').strip()

        if username:
            if User.objects.exclude(pk=user.pk).filter(username=username).exists():
                return Response({'detail': 'Username already taken.'}, status=400)
            user.username = username
        if email:
            if User.objects.exclude(pk=user.pk).filter(email=email).exists():
                return Response({'detail': 'Email already in use.'}, status=400)
            user.email = email
        if first_name: user.first_name = first_name
        if last_name:  user.last_name  = last_name

        user.save()
        return Response(UserSerializer(user).data)

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user             = request.user
        old_password     = request.data.get('old_password', '')
        new_password     = request.data.get('new_password', '')
        confirm_password = request.data.get('confirm_password', '')

        if not all([old_password, new_password, confirm_password]):
            return Response({'detail': 'All fields are required.'}, status=400)
        if not user.check_password(old_password):
            return Response({'detail': 'Current password is incorrect.'}, status=400)
        if new_password != confirm_password:
            return Response({'detail': 'New passwords do not match.'}, status=400)
        if len(new_password) < 6:
            return Response({'detail': 'Password must be at least 6 characters.'}, status=400)
        if old_password == new_password:
            return Response({'detail': 'New password must be different.'}, status=400)

        user.set_password(new_password)
        user.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'detail': 'Password changed successfully.',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })

# ── FORGOT PASSWORD ──────────────────────────────────────────

class ForgotPasswordView(APIView):
    """Step 1 — OTP prints in backend terminal"""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'detail': 'Email is required.'}, status=400)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'If this email exists, an OTP has been sent.'})

        # Delete old unused OTPs
        PasswordResetOTP.objects.filter(user=user, is_used=False).delete()

        # Generate new OTP
        otp_code = PasswordResetOTP.generate_otp()
        PasswordResetOTP.objects.create(user=user, otp=otp_code)

        # ── Print OTP in VS Code terminal ────────────────
        print("\n" + "="*50)
        print(f"  PASSWORD RESET OTP")
        print(f"  Email  : {user.email}")
        print(f"  OTP    : {otp_code}")
        print(f"  Valid for 10 minutes")
        print("="*50 + "\n")
        # ─────────────────────────────────────────────────

        return Response({'detail': 'OTP sent to your email address.'})


class VerifyOTPView(APIView):
    """Step 2 — Verify OTP"""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        otp   = request.data.get('otp',   '').strip()

        if not email or not otp:
            return Response({'detail': 'Email and OTP are required.'}, status=400)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'Invalid email.'}, status=400)

        otp_obj = PasswordResetOTP.objects.filter(
            user=user, otp=otp, is_used=False
        ).order_by('-created_at').first()

        if not otp_obj:
            return Response({'detail': 'Invalid OTP.'}, status=400)

        if not otp_obj.is_valid():
            return Response({'detail': 'OTP has expired. Please request a new one.'}, status=400)

        return Response({'detail': 'OTP verified.', 'email': email})


class ResetPasswordView(APIView):
    """Step 3 — Set new password"""
    permission_classes = [AllowAny]

    def post(self, request):
        email            = request.data.get('email', '').strip().lower()
        otp              = request.data.get('otp', '').strip()
        new_password     = request.data.get('new_password', '')
        confirm_password = request.data.get('confirm_password', '')

        if not all([email, otp, new_password, confirm_password]):
            return Response({'detail': 'All fields are required.'}, status=400)
        if new_password != confirm_password:
            return Response({'detail': 'Passwords do not match.'}, status=400)
        if len(new_password) < 6:
            return Response({'detail': 'Password must be at least 6 characters.'}, status=400)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'Invalid request.'}, status=400)

        otp_obj = PasswordResetOTP.objects.filter(
            user=user, otp=otp, is_used=False
        ).order_by('-created_at').first()

        if not otp_obj or not otp_obj.is_valid():
            return Response({'detail': 'Invalid or expired OTP.'}, status=400)

        user.set_password(new_password)
        user.save()
        otp_obj.is_used = True
        otp_obj.save()

        return Response({'detail': 'Password reset successfully. Please login.'})


class UsersListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]