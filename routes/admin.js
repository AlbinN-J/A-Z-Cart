
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

router.post('/addProducts', (req, res) => {
	// console.log(req.body);
	// console.log(req.files.Image);

	productHelpers.addProduct(req.body, (id) => {  //Adding product image in addProducts
		let image = req.files.Image;
		image.mv('./public/productImages/' + id + '.jpg', (err, done) => {
			if (!err) {
				res.render('admin/addProducts');
			} else {
				console.log(err);
			}
		});
	});
});

router.get('/deleteProduct/:id', (req, res) => {  //Deleting product and image
	let proId = req.params.id;
	console.log(proId);
	const fs = require('fs');
	const path = './public/productImages/' + proId + '.jpg';

	productHelpers.deleteProduct(proId).then((response) => {
		res.redirect('/admin/');
	});

	try {    //Deleting product image from productImages folder
		fs.unlinkSync(path);
		console.log('Deleted');
	} catch (err) {
		console.error(err);
	}
});

router.get('/editProduct/:id',async(req, res)=>{  //Editing product details
  let product=await productHelpers.getProductDetails(req.params.id)
  console.log(product);
  res.render('admin/editProduct',{product})
})

router.post('/editProduct/:id',(req,res)=>{   //Editing product image
  // console.log(req.params.id)
  let id= req.params.id
  productHelpers.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin')
    if(req.files.Image){
      let image=req.files.Image
      image.mv('./public/productImages/' + id + '.jpg');
    }
  })
})

module.exports = router;
