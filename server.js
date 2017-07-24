var express = require('express');
var path = require('path');

var app = express();
app.disable('x-powered-by');
app.use(express.static(path.join(__dirname, 'dist')));


app.get('/sf-movies', function(req, res) {
    res.sendFile('dist/main.html', { root: __dirname });
});


// if we got here, the request didn't match. Forward a 404 to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

//error handler
app.use((err, req, res, next) => {
    if (err.status != 404)
        console.error("Captured server error: " + err.message + "\n" + err.stack);

    // render the error page if the response isn't terminated or sent
    if (res && !res.headersSent) {
        res.status(err.status || 500);
        res.end(err.message);
    }
});


var port = 3000;
if (process.argv.length > 2 && process.argv[2] && !isNaN(parseInt(process.argv[2])))
    port = parseInt(process.argv[2]);

app.listen(port, function() {
    console.log('Server running on port ' + port)
})