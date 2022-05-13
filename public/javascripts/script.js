function addToCart(proId){
    $.ajax({
        url:'/addToCart/'+proId,
        method: 'get',
        success:(response)=>{
            if(response.status){
                let count=$('#cartCount').html()
                count=parseInt(count)+1 
                $('#cartCount').html(count)
            }
            
        }
    })
}