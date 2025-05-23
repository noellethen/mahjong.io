from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import Integer, String

db = SQLAlchemy()
app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"]
cors = CORS(app, origins='*')
db.init_app(app)

class Base(DeclarativeBase):
    pass

class User(db.Model):
    id: Mapped[int] = mapped_column(primary_key = True)
    username: Mapped[str] = mapped_column(unique = True)
    email: Mapped[str]

with app.app_context():
    db.create_all()

@app.route("/")
def serve_login():
    return send_from_directory(app.template_folder, 'index.html')

@app.route('/gamemode')
def serve_gamemode():
    return send_from_directory(app.template_folder, 'gamemode.html')

@app.route('/quizmode')
def serve_quizmode():
    return send_from_directory(app.template_folder, 'quizmode.html')

if __name__ == "__main__":
    app.run(debug=True, port=5000)