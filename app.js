//gxuliang@gmail.com
/**
 * Module dependencies.
 */

 var express = require('express');
 var routes = require('./routes');
 var user = require('./routes/user');
 var http = require('http');
 var path = require('path');
 var flash = require('connect-flash');



 var partials = require('express-partials');
 var MongoStore = require('connect-mongo')(express); 
 var settings = require('./settings');
 var crypto = require('crypto');

 var app = express();

app.use(partials()); //这个一定要写在app.use(app.router)之前


// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(flash());



app.use(express.cookieParser()); 

app.use(express.session({
	secret: settings.cookieSecret, 
	store: new MongoStore({
		db: settings.db
	})
}));


app.use(function(req, res, next){
	res.locals.user = req.session.user;
	var err = req.flash('error');
	if(err.length)
		res.locals.error = err;
	else
		res.locals.error = null;

	var succ = req.flash('success');
	if(succ.length)
		res.locals.success = succ;
	else
		res.locals.success = null;
	
	next();
});

app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}



//app.get('/', routes.index);
app.get('/users', user.list);
app.get('/reg', routes.reg);
app.get('/login', routes.login);


var User = require('./models/user.js');
var Post = require('./models/post.js');

app.get('/logout', function(req, res) { 
	req.session.user = null; 
	req.flash('success', '登出成功'); 
	res.redirect('/');
});

app.post('/reg', checkNotLogin);
//检验用户两次输入的口令是否一致
app.post('/reg', function(req, res) {
	if (req.body['password-repeat'] != req.body['password']) {
		req.flash('error', '两次输入的口令不一致');
		return res.redirect('/reg'); 
	}
	//生成口令的散列值
	var md5 = crypto.createHash('md5');
	var password = md5.update(req.body.password).digest('base64');
	var newUser = new User({ 
		name: req.body.username, password: password,
	});
	//检查用户名是否已经存在
	User.get(newUser.name, function(err, user) {
		console.log('%s', user);
		if (user)
			err = '用户名已经存在';
		if (err) {
			req.flash('error', err); 
			return res.redirect('/reg');
		}
	//如果不存在则新增用户 
	newUser.save(function(err) {
		if (err) {
			req.flash('error', err); 
			return res.redirect('/reg');
		}
		req.session.user = newUser; 
		req.flash('success', '注册成功'); 
		res.redirect('/');
	});
}); 
});

app.post('/login', checkNotLogin);
app.post('/login', function(req, res) {
	//生成口令的散列值
	var md5 = crypto.createHash('md5');
	var password = md5.update(req.body.password).digest('base64');

	User.get(req.body.username, function(err, user) { 
		if (!user) {
			req.flash('error', '用户不存在');
			return res.redirect('/login'); 
		}
		if (user.password != password) { 
			req.flash('error', '用户口令错误'); 
			return res.redirect('/login');
		}
		req.session.user = user; 
		req.flash('success', '登入成功'); 
		res.redirect('/');
	}); 
});


app.get('/u/:user', function(req, res) {
	User.get(req.params.user, function(err, user) {	
		console.log("user %s", req.params.user);
		if (!user) {
			req.flash('error', '用户不存在'); 
			return res.redirect('/');
		}
		Post.get(user.name, function(err, posts) {
			if (err) { 
				req.flash('error', err); 
				return res.redirect('/');
          	}
          	res.render('user', {
            	title: user.name,
            	posts: posts,
          	});
		}); 
	});
});

app.post('/post', checkLogin); 
app.post('/post', function(req, res) {
	var currentUser = req.session.user;
	var post = new Post(currentUser.name, req.body.post); 
	post.save(function(err) {
 		if (err) {
			req.flash('error', err); 
			return res.redirect('/');
 		}
		req.flash('success', '发表成功'); 
		res.redirect('/');
	}); 
});

app.get('/', function(req, res) { 
	Post.get(null, function(err, posts) {
 		if (err) {
 			posts = [];
		}
		res.render('index', {
			title: '首页',
  			posts: posts,
		});
 	}); 
});

function checkLogin(req, res, next) { 
	if (!req.session.user) {
		req.flash('error', '未登入');
		return res.redirect('/login'); 
	}
	next(); 
}
    
function checkNotLogin(req, res, next) {
      if (req.session.user) {
		req.flash('error', '已登入');
        return res.redirect('/');
      }
		next(); 
}


http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});
