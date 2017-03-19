from flask import Flask, request, render_template, send_from_directory
app = Flask(__name__, static_folder='templates')
client = zerorpc.Client(timeout=30000, heartbeat=None)
ENDPOINT=4000

@app.route('/')
def Tetris():
    return render_template('index.html')

@app.route('/<path:path>')
def send_static(path):
    return send_from_directory(app.static_folder, path)

if __name__ == '__main__':
    client.connect('tcp://127.0.0.1:' + str(ENDPOINT))
    app.debug = True
    app.run(host = '0.0.0.0', port = 5000, threaded = True)

