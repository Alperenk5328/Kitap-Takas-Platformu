from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os

# Get the parent directory path
template_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'templates')
static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'static')

app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)
app.config['SECRET_KEY'] = 'kitap_takas_guvenlik_anahtari_2026'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///kitap_takas.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# User model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    owned_books = db.relationship('Book', backref='owner', lazy=True, foreign_keys='Book.owner_id')
    swap_requests_sent = db.relationship('SwapRequest', backref='requester', lazy=True, foreign_keys='SwapRequest.requester_id')
    swap_requests_received = db.relationship('SwapRequest', backref='receiver', lazy=True, foreign_keys='SwapRequest.receiver_id')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# Book model
class Book(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    author = db.Column(db.String(100), nullable=False)
    publisher = db.Column(db.String(100))
    genre = db.Column(db.String(50))
    condition = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text)
    photo_url = db.Column(db.String(500))
    is_available = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    swap_requests_as_requested = db.relationship('SwapRequest', backref='requested_book', lazy=True, foreign_keys='SwapRequest.requested_book_id')
    swap_requests_as_offered = db.relationship('SwapRequest', backref='offered_book', lazy=True, foreign_keys='SwapRequest.offered_book_id')

# SwapRequest model
class SwapRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    status = db.Column(db.String(50), default='beklemede')  # beklemede, eslesti, reddedildi, iptal
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    requester_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    requested_book_id = db.Column(db.Integer, db.ForeignKey('book.id'), nullable=False)
    offered_book_id = db.Column(db.Integer, db.ForeignKey('book.id'))
    
    # Adres bilgileri — takas eşleşince doldurulur
    requester_address = db.Column(db.Text)       # kitabı isteyen kişinin adresi
    receiver_address = db.Column(db.Text)         # kitabı veren kişinin adresi
    requester_phone = db.Column(db.String(30))
    receiver_phone = db.Column(db.String(30))
    requester_submitted = db.Column(db.Boolean, default=False)
    receiver_submitted = db.Column(db.Boolean, default=False)

# ─── Auth ────────────────────────────────────────────────────────────────────

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/kitap-ekle')
def kitap_ekle():
    return render_template('kitap-ekle.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if User.query.filter_by(username=username).first():
            return jsonify({'success': False, 'message': 'Bu kullanıcı adı zaten kullanılıyor'})
        if User.query.filter_by(email=email).first():
            return jsonify({'success': False, 'message': 'Bu e-posta adresi zaten kullanılıyor'})
        
        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Kayıt başarılı'})
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            session['user_id'] = user.id
            session['username'] = user.username
            return jsonify({'success': True, 'message': 'Giriş başarılı'})
        else:
            return jsonify({'success': False, 'message': 'Kullanıcı adı veya şifre hatalı'})
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

@app.route('/api/check-auth')
def check_auth():
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        if user:
            return jsonify({
                'authenticated': True,
                'user': {'id': user.id, 'username': user.username, 'email': user.email}
            })
    return jsonify({'authenticated': False})

# ─── Books ────────────────────────────────────────────────────────────────────

def book_to_dict(book, include_owner=True):
    d = {
        'id': book.id,
        'title': book.title,
        'author': book.author,
        'publisher': book.publisher,
        'genre': book.genre,
        'condition': book.condition,
        'description': book.description,
        'photo_url': book.photo_url,
        'is_available': book.is_available,
        'created_at': book.created_at.isoformat()
    }
    if include_owner:
        d['owner'] = book.owner.username
    return d

@app.route('/api/books', methods=['GET', 'POST'])
def books():
    if request.method == 'POST':
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Giriş yapmalısınız'})
        
        data = request.get_json()
        book = Book(
            title=data['title'],
            author=data['author'],
            publisher=data.get('publisher', ''),
            genre=data.get('genre', ''),
            condition=data['condition'],
            description=data.get('description', ''),
            photo_url=data.get('photo_url', ''),
            owner_id=session['user_id']
        )
        db.session.add(book)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Kitap başarıyla eklendi'})
    
    else:
        all_books = Book.query.filter_by(is_available=True).order_by(Book.created_at.desc()).all()
        return jsonify([book_to_dict(b) for b in all_books])

@app.route('/api/my-books')
def my_books():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Giriş yapmalısınız'})
    
    all_books = Book.query.filter_by(owner_id=session['user_id']).all()
    return jsonify([book_to_dict(b, include_owner=False) for b in all_books])

@app.route('/api/search-books')
def search_books():
    query = request.args.get('q', '').lower()
    genre = request.args.get('genre', '')
    
    books_query = Book.query.filter_by(is_available=True)
    if query:
        books_query = books_query.filter(
            db.or_(Book.title.ilike(f'%{query}%'), Book.author.ilike(f'%{query}%'))
        )
    if genre:
        books_query = books_query.filter(Book.genre == genre)
    
    all_books = books_query.order_by(Book.created_at.desc()).all()
    return jsonify([book_to_dict(b) for b in all_books])

# ─── Swap Requests ────────────────────────────────────────────────────────────

@app.route('/api/swap-request', methods=['POST'])
def swap_request():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Giriş yapmalısınız'})
    
    data = request.get_json()
    requested_book_id = data['requested_book_id']
    
    requested_book = Book.query.get(requested_book_id)
    if not requested_book or not requested_book.is_available:
        return jsonify({'success': False, 'message': 'Kitap mevcut değil'})
    
    if requested_book.owner_id == session['user_id']:
        return jsonify({'success': False, 'message': 'Kendi kitabınız için takas isteği gönderemezsiniz'})
    
    # ── Kullanıcının takasa açık kitabı var mı? ────────────────────────────────
    requester_has_book = Book.query.filter_by(
        owner_id=session['user_id'], is_available=True
    ).first()
    if not requester_has_book:
        return jsonify({'success': False, 'message': 'Takas isteği gönderebilmek için önce takasa açık en az bir kitabınız olmalı'})
    # ───────────────────────────────────────────────────────────────────────────

    # ── Mükerrer istek kontrolü ────────────────────────────────────────────────
    # Aynı kullanıcı, aynı kitap için aktif (beklemede) istek göndermiş mi?
    existing = SwapRequest.query.filter_by(
        requester_id=session['user_id'],
        requested_book_id=requested_book_id,
        status='beklemede'
    ).first()
    if existing:
        return jsonify({'success': False, 'message': 'Bu kitap için zaten bekleyen bir takas isteğiniz var'})
    # ───────────────────────────────────────────────────────────────────────────
    
    swap_req = SwapRequest(
        requester_id=session['user_id'],
        receiver_id=requested_book.owner_id,
        requested_book_id=requested_book_id
    )
    db.session.add(swap_req)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Takas isteği gönderildi'})

@app.route('/api/swap-respond', methods=['POST'])
def swap_respond():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Giriş yapmalısınız'})
    
    data = request.get_json()
    swap_request_id = data['swap_request_id']
    offered_book_id = data.get('offered_book_id')
    action = data['action']  # 'accept' or 'reject'
    
    swap_req = SwapRequest.query.get(swap_request_id)
    if not swap_req or swap_req.receiver_id != session['user_id']:
        return jsonify({'success': False, 'message': 'İstek bulunamadı'})
    
    if action == 'reject':
        swap_req.status = 'reddedildi'
        db.session.commit()
        return jsonify({'success': True, 'message': 'Takas isteği reddedildi'})
    
    if action == 'accept':
        if not offered_book_id:
            return jsonify({'success': False, 'message': 'Karşılık kitap seçmelisiniz'})
        
        offered_book = Book.query.get(offered_book_id)
        # offered_book, isteği gönderen kişiye (requester) ait olmalı
        if not offered_book or offered_book.owner_id != swap_req.requester_id:
            return jsonify({'success': False, 'message': 'Geçersiz kitap'})
        
        swap_req.offered_book_id = offered_book_id
        swap_req.status = 'eslesti'
        swap_req.requested_book.is_available = False
        offered_book.is_available = False
        
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Takas eşleşti!',
            'swap_id': swap_req.id
        })

@app.route('/api/user-books/<int:user_id>')
def user_books(user_id):
    """Belirli bir kullanıcının takasa açık kitaplarını döndürür."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Giriş yapmalısınız'})
    available = Book.query.filter_by(owner_id=user_id, is_available=True).all()
    return jsonify([book_to_dict(b, include_owner=False) for b in available])

@app.route('/api/my-swaps')
def my_swaps():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Giriş yapmalısınız'})
    
    sent_swaps = SwapRequest.query.filter_by(requester_id=session['user_id']).all()
    received_swaps = SwapRequest.query.filter_by(receiver_id=session['user_id']).all()
    
    swaps_list = []
    
    for swap in sent_swaps:
        d = {
            'id': swap.id,
            'type': 'sent',
            'status': swap.status,
            'requested_book': {'title': swap.requested_book.title, 'author': swap.requested_book.author},
            'receiver': swap.receiver.username,
            'created_at': swap.created_at.isoformat(),
            'address_submitted': swap.requester_submitted,
            'other_submitted': swap.receiver_submitted,
        }
        if swap.offered_book_id:
            d['offered_book'] = {'title': swap.offered_book.title, 'author': swap.offered_book.author}
        # Kendi adres/tel bilgilerini göster (eşleşme varsa)
        if swap.status == 'eslesti':
            d['my_address'] = swap.requester_address or ''
            d['my_phone'] = swap.requester_phone or ''
            # Karşı taraf bilgilerini sadece her iki taraf da gönderdiyse aç
            if swap.requester_submitted and swap.receiver_submitted:
                d['other_address'] = swap.receiver_address or ''
                d['other_phone'] = swap.receiver_phone or ''
        swaps_list.append(d)
    
    for swap in received_swaps:
        d = {
            'id': swap.id,
            'type': 'received',
            'status': swap.status,
            'requested_book': {'title': swap.requested_book.title, 'author': swap.requested_book.author},
            'requester': swap.requester.username,
            'requester_id': swap.requester_id,   # modal için gerekli
            'created_at': swap.created_at.isoformat(),
            'address_submitted': swap.receiver_submitted,
            'other_submitted': swap.requester_submitted,
        }
        if swap.offered_book_id:
            d['offered_book'] = {'title': swap.offered_book.title, 'author': swap.offered_book.author}
        if swap.status == 'eslesti':
            d['my_address'] = swap.receiver_address or ''
            d['my_phone'] = swap.receiver_phone or ''
            if swap.requester_submitted and swap.receiver_submitted:
                d['other_address'] = swap.requester_address or ''
                d['other_phone'] = swap.requester_phone or ''
        swaps_list.append(d)
    
    return jsonify(swaps_list)

# ── YENİ: Adres bilgisi kaydetme ──────────────────────────────────────────────
@app.route('/api/swap-address', methods=['POST'])
def swap_address():
    """Eşleşmiş bir takas için adres ve telefon bilgisini kaydeder."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Giriş yapmalısınız'})
    
    data = request.get_json()
    swap_id = data.get('swap_id')
    address = data.get('address', '').strip()
    phone = data.get('phone', '').strip()
    
    if not address:
        return jsonify({'success': False, 'message': 'Adres boş bırakılamaz'})
    
    swap = SwapRequest.query.get(swap_id)
    if not swap or swap.status != 'eslesti':
        return jsonify({'success': False, 'message': 'Takas bulunamadı'})
    
    uid = session['user_id']
    
    if swap.requester_id == uid:
        swap.requester_address = address
        swap.requester_phone = phone
        swap.requester_submitted = True
    elif swap.receiver_id == uid:
        swap.receiver_address = address
        swap.receiver_phone = phone
        swap.receiver_submitted = True
    else:
        return jsonify({'success': False, 'message': 'Yetkisiz işlem'})
    
    db.session.commit()
    
    both_ready = swap.requester_submitted and swap.receiver_submitted
    return jsonify({
        'success': True,
        'message': 'Adres kaydedildi',
        'both_ready': both_ready  # her iki taraf da gönderdiyse karşılıklı bilgiler açılır
    })

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)