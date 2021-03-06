var express = require('express');

var router = express.Router();

var productHelpers=require('../helpers/productHelpers')

var userHelpers=require('../helpers/userHelpers')

const verifyLogin=(req,res,next)=>{
  if(req.session.loggedIn){
    next()
  }else{
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/',async function(req, res, next) {
  let user=req.session.user
  // console.log(user);
  let cartCount=null
  if(req.session.user){
    cartCount=await userHelpers.getCartCount(req.session.user._id)
  }
  productHelpers.getAllProduct().then((products)=>{
    // console.log(products);

    res.render('user/viewProducts',{title: 'Shoping Cart',products,user,cartCount})
  })
});

router.get('/login',(req,res)=>{
  if(req.session.loggedIn){
    res.redirect('/')
  }else{
    res.render('user/login',{'loginErr':req.session.loginErr})
    req.session.loginErr=false
  }
    
})

router.get('/signup',(req,res)=>{
  res.render('user/signup')
})

router.post('/signup',(req,res)=>{
  userHelpers.doSignup(req.body).then((data)=>{
    console.log(data);
    req.session.loggedIn=true
    req.session.user=response
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
      req.session.loginErr='Invalid email and password'
      res.redirect('/login')
    }
  })
})

router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.redirect('/')
})

router.get('/cart',verifyLogin,async(req,res)=>{
  let products=await userHelpers.getCartProducts(req.session.user._id)
  let totalValue=await userHelpers.getTotalAmount(req.session.user._id)
  console.log(products);
  console.log('***'+req.session.user._id);
  res.render('user/cart',{products,user:req.session.user._id,totalValue})
})

router.get('/addToCart/:id',(req,res)=>{
  // console.log('api call');
  userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.json({status: true})
  })
})

router.post('/changeProductQuantity',(req,res,next)=>{
  console.log(req.body);
  userHelpers.changeProductQuantity(req.body).then(async(response)=>{
    response.total=await userHelpers.getTotalAmount(req.body.user)
    res.json(response)
  })
})

router.get('/placeOrder',verifyLogin,async(req,res)=>{
  let total=await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/placeOrder',{total,user:req.session.user})
})

router.post('/placeOrder',async(req,res)=>{
  let products=await userHelpers.getCartProductList(req.body.userId)
  let totalPrice= await userHelpers.getTotalAmount(req.body.userId)
  userHelpers.placeOrder(req.body,products,totalPrice).then((orderId)=>{
    if(req.body['payment-method']=='cod'){
      res.json({status: true})
    }else{
      userHelpers.generateRazorpay(orderId,totalPrice).then((response)=>{
        console.log(orderId);
        res.json({response})
      })
    }
    
  })
  console.log(req.body);
})

router.get('/success-page', (req, res)=>{
  res.render('user/success-page',{user:req.session.user})
})

// router.get('/view-orders',verifyLogin, async(req, res)=>{
//   let orders=await userHelpers.getUserOrders(req.session.user._id)
//   res.render('user/view-orders',{user:req.body.user})
// })

router.get('/view-orders',async(req,res)=>{
  let orders=await userHelpers.getUserOrders(req.session.user._id)
  res.render('user/view-orders',{user:req.session.user,orders})
})

// router.get('/view-orderproduct/:id',async(req, res)=>{
//   let products=await userHelpers.getOrderProducts(req.params._id)
//   res.render('user/view-orderproduct',{user:req.body.user})
// })

router.get('/view-orderproduct/:id',async(req,res)=>{
  let products=await userHelpers.getOrderProducts(req.params._id)
  res.render('user/view-orderproduct',{user:req.session.user,products})
})
module.exports = router;
