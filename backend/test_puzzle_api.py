import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gaming_platform.settings')
django.setup()

from games.models import DailyPuzzle
from datetime import date
from django.contrib.auth import get_user_model

User = get_user_model()

print("🔍 PUZZLE API DIAGNOSTIC\n")
print("="*50)

# Check puzzles - FIXED: using 'date' not 'puzzle_date'
puzzles = DailyPuzzle.objects.filter(date=date.today())
print(f"\n1. Puzzles for today ({date.today()}):")
print(f"   Total: {puzzles.count()}")

if puzzles.count() > 0:
    for p in puzzles:
        word = p.puzzle_data.get('word', 'N/A')
        theme = p.puzzle_data.get('theme', 'N/A')
        print(f"   ✅ {p.game_type} ({p.difficulty})")
        print(f"      Word: {word}")
        print(f"      Theme: {theme}")
        print(f"      ID: {p.id}")
else:
    print("   ❌ No puzzles found!")
    print("   Run: python manage.py generate_daily_puzzles")

# Check all puzzles in database
all_puzzles = DailyPuzzle.objects.all()
print(f"\n   Total puzzles in DB: {all_puzzles.count()}")
if all_puzzles.count() > 0:
    print("   Dates in DB:")
    for p in all_puzzles.order_by('-date')[:5]:
        print(f"      - {p.date}: {p.game_type} ({p.difficulty})")

# Check users
print("\n" + "="*50)
users = User.objects.all()
print(f"\n2. Users:")
print(f"   Total: {users.count()}")
if users.count() > 0:
    for u in users:
        print(f"   - {u.username} (ID: {u.id}, Points: {u.total_points})")
else:
    print("   ❌ No users found!")
    print("   Run: python manage.py createsuperuser")

# Check URL pattern
print("\n" + "="*50)
from django.urls import reverse
try:
    url = reverse('games:daily_puzzle', kwargs={'game_type': 'wordle'})
    print(f"\n3. API URL pattern: ✅")
    print(f"   URL: {url}")
except Exception as e:
    print(f"\n3. API URL pattern: ❌ NOT FOUND")
    print(f"   Error: {e}")

# Check settings
print("\n" + "="*50)
from django.conf import settings
print(f"\n4. Django Settings:")
print(f"   CORS origins: {settings.CORS_ALLOWED_ORIGINS}")
print(f"   CORS credentials: {settings.CORS_ALLOW_CREDENTIALS}")
print(f"   Debug mode: {settings.DEBUG}")
print(f"   Database: {settings.DATABASES['default']['NAME']}")

# Check Anthropic API key
print("\n" + "="*50)
print(f"\n5. Anthropic API:")
api_key = getattr(settings, 'ANTHROPIC_API_KEY', None)
if api_key:
    print(f"   API Key: {api_key[:15]}... ✅")
    print(f"   Length: {len(api_key)} characters")
else:
    print("   API Key: ❌ NOT SET")
    print("   Check your .env file!")

# Test puzzle generation logic
print("\n" + "="*50)
print(f"\n6. Puzzle Generation Test:")
try:
    # Check if we can create a test puzzle
    test_date = date.today()
    existing = DailyPuzzle.objects.filter(
        date=test_date,
        game_type='wordle',
        difficulty='easy'
    ).exists()
    
    if existing:
        print(f"   ✅ Easy Wordle puzzle exists for today")
    else:
        print(f"   ⚠️  Easy Wordle puzzle missing for today")
        print(f"   Run: python manage.py generate_daily_puzzles")
        
except Exception as e:
    print(f"   ❌ Error checking puzzles: {e}")

print("\n" + "="*50)
print("\n✅ Diagnostic complete!")
print("\nNext steps:")
if puzzles.count() == 0:
    print("  1. Run: python manage.py generate_daily_puzzles")
if users.count() == 0:
    print("  2. Run: python manage.py createsuperuser")
print("  3. Start server: python manage.py runserver")
print("  4. Start frontend: cd ../frontend && npm run dev")
print("\n" + "="*50)