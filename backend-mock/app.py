from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/api/health')
def health():
    return jsonify(status="ok", service="backend-mock")

@app.route('/api/expenses')
def expenses():
    return jsonify([
        {"id": 1, "item": "Coffee", "amount": 3.50},
        {"id": 2, "item": "Bus fare", "amount": 1.20}
    ])

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
