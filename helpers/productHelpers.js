var db = require('../config/connection');

var collection = require('../config/collections');
const { response } = require('../app');

var objectId = require('mongodb').ObjectId;

module.exports = {
	addProduct: (product, callback) => {
		console.log(product);
		db.get()
			.collection('product')
			.insertOne(product)
			.then((data) => {
				console.log(data);
				callback(data.insertedId);
			});
	},
	getAllProduct: () => {
		return new Promise(async (resolve, reject) => {
			let products = await db
				.get()
				.collection(collection.PRODUCT_COLLECTION)
				.find()
				.toArray();
			resolve(products);
		});
	},
	deleteProduct: (proId) => {
		return new Promise((resolve, reject) => {
			db.get()
				.collection(collection.PRODUCT_COLLECTION)
				.deleteOne({ _id: objectId(proId) })
				.then((response) => {
					resolve(response);
				});
		});
	},
	getProductDetails: (proId) => {
		return new Promise((resolve, reject) => [
			db
				.get()
				.collection(collection.PRODUCT_COLLECTION)
				.findOne({ _id: objectId(proId) })
				.then((product) => {
					resolve(product);
				}),
		]);
	},
	updateProduct: (proId, productDetails) => {
		return new Promise((resolve, reject) => {
			db.get()
				.collection(collection.PRODUCT_COLLECTION)
				.updateOne(
					{ _id: objectId(proId) },
					{
						$set: {
							Name: productDetails.Name,
							Description: productDetails.Description,
							Price: productDetails.Price,
							Category: productDetails.Category,
						},
					}
				).then((response)=>{
                    resolve()
                })
		});
	},
};
