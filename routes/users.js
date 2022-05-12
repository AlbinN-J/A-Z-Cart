var express = require('express');

var router = express.Router();

var productHelpers=require('../helpers/productHelpers')

var userHelpers=require('../helpers/userHelpers')

/* GET home page. */
router.get('/', function(req, res, next) {
  let user=req.session.user
  // console.log(user);
  productHelpers.getAllProduct().then((products)=>{
    // console.log(products);

    res.render('user/viewProducts',{title: 'Shoping Cart',products,user})
  })
});

router.get('/login',(req,res)=>{
  if(req.session.loggedIn){
    res.redirect('/')
  }else{
    res.render('user/login')
  }
    
})

router.get('/signup',(req,res)=>{
  res.render('user/signup')
})

router.post('/signup',(req,res)=>{
  userHelpers.doSignup(req.body).then((data)=>{
    console.log(data);
    res.redirect('/')
  })
})

router.post('/login',(req,res)=>{
  userHelpers.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.loggedIn=true
      req.session.user=response.user
      res.redirect('/')
    }else{
      res.redirect('/login')
    }
  })
})

router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.redirect('/login')
})

module.exports = router;
