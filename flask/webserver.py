from flask import Flask, request, render_template
app = Flask(__name__)

@app.route('/')
@app.route('/tetris')
def Tetris():
        return render_template('tetris.html')
@app.route('/genetris')
def Genetris():
        return render_template('genetris.html')

if __name__ == '__main__':
    app.debug = True
    app.run(host = '138.197.150.85', port = 5000)
