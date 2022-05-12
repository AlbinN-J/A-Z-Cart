var express = require('express');
var router = express.Router();

var productHelpers=require('../helpers/productHelpers')

/* GET users listing. */
router.get('/', function(req, res, next) {

  productHelpers.getAllProduct().then((products)=>{
    console.log(products);
    res.render('admin/viewProducts',{title: 'Shoping Cart',admin:true,products})
  })

  
});

router.get('/addProducts',(req,res)=>{
  res.render('admin/addProducts')
})

router.post('/addProducts',(req,res)=>{
  // console.log(req.body);
  // console.log(req.files.Image);

  productHelpers.addProduct(req.body,(id)=>{
    let image=req.files.Image
    image.mv('./public/productImages/'+id+'.jpg',(err,done)=>{
      if(!err){
        res.render('admin/addProducts')
      }else{
        console.log(err);
      }
    })
    
  })
})

module.exports = router;
