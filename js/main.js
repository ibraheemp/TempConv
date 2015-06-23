//DECLARATIONS
var __sco = typeof __sco == "undefined" ? {} : __sco;
var __scd = typeof __scd == "undefined" ? {} : __scd;


//INIT the Editors
__sco = {
	'editor1' : '',
	'editor2' : '',
	'url': location.protocol + '//' + location.host + '/',
	'regex': {
		'links' : /([\[\]0-9|])/g
	},
	'excludes': {
		'links' : ['[[webview]]', '#', '[[unsubscribe]]', 'tel']
	},
	'placeholders':{
		'totalprice': '@(item_totalprice)', //"var item_totalpricedouble = 0.00; item_totalpricedouble = @product.Price * @product.Quantity; var item_totalprice = Math.Round(item_totalpricedouble, 2).ToString(\"0.00\");"
		'totalvalue': '@Model.BasketValue',
		'itemimage': '@(product.ImageUrl)',
		'itemvalue' : '@(item_price)', //var item_pricedouble = 0.00; item_pricedouble = @product.Price; var item_price = Math.Round(item_pricedouble, 2).ToString(\"0.00\");
		'itemquantity': '@(product.Quantity)',
		'itemquantity1': '@(product.Quantity)',
		'itemcurrency': '@Model.CurrencyCode',
		'customfield1': '@TryGetItemField(@product, \"f1\")', //var customfield1 = @TryGetItemField(@product, \"f1\");
		'customfield2': ' @TryGetItemField(@product, \"f2\")', //same as above
		'numitems': '@Model.Products.Sum(p => p.Quantity)', //@{ var itemCount = @Model.Products.Sum(p => p.Quantity); }
		'customeremail': '@Model.Customer.Email', //var email = @Model.Customer.Email;
		'itemid': '@(product.ProductId);',
		'itemname': '@(product.Name)',
		'firstname': '@Model.Customer.FirstName',
		'lastname': '@Model.Customer.LastName',
		'salutation': '@Model.Customer.Salutation',
		'mobile': '@Model.Customer.Mobile',
		'customername': '@(salutation)' //var salutation = "there"; if(Model.Customer != null && string.IsNullOrEmpty(Model.Customer.FirstName) == false) { salutation = String.Format("{0}", Model.Customer.FirstName); }
	}
}

//FUNCTIONS
__sco.func = {

	load: function(){
		__sco.editor1 = ace.edit("editor1");
		__sco.editor1.setTheme("ace/theme/monokai");
	    __sco.editor1.getSession().setMode("ace/mode/html");

	    __sco.editor2 = ace.edit("editor2");
	    __sco.editor2.setTheme("ace/theme/monokai");
	    __sco.editor2.getSession().setMode("ace/mode/html");
	},

	init: function(){
		__scd = {
			'links_new': [],
			'sessions': [],
			'items' : [],
			'customer': [],
			'html': '',
			'shtml': '',
			'ihtml': '',
			'chtml': ''
		}

		if(window.location.pathname != '/'){
			__sco.url = location.protocol + '//' + location.host + window.location.pathname ;
		}
	},

	check: function(){
		var html = __sco.editor1.getValue();
		if(html.indexOf('<body') > -1){
			return true;
		}else{
			return false;
		}
	},

	convert: function(){

		//check whether valid input
		if(__sco.func.check() == false){ alert('Not a valid Input!'); throw new Error("Bad Input!"); }

		//init first
		__sco.func.init();

		var html = __sco.editor1.getValue();
		__scd.html = html; //set the object

		//process the links
		var links = html.match(/href="([^"]*)/g);

		for(var i=0;i<links.length;i++){
			var a = links[i];
			var href = a.split('href=')[1].replace('"','');
			var old_link = decodeURIComponent(href.replace(__sco.url, ''));

			if(__sco.excludes.links.indexOf(old_link.toLowerCase()) <= -1){
				if(old_link.indexOf('tel:') <= -1){
					var new_link = old_link.indexOf('|') > -1 ?  '[[link]]' + decodeURIComponent(href.replace(__sco.url, '')).split('|')[1] + '[[/link]]' : old_link;
					__scd.html = __scd.html.replace(old_link, new_link);
				}
			}else{
				__scd.html = __scd.html.replace(old_link, old_link.toLowerCase());
			}
		}
		//end

		//process the mediaqueries
		__scd.html = __scd.html.replace(/@media/g, '@@media');
		//end



		//go through html and find text inside brackets
		var matches = [];
		var pattern = /\[\[(.*?)\]\]/g; //regex for matching brakcets
		var match;
		while ((match = pattern.exec(__scd.html)) != null)
		{
		  matches.push(match[1]);
		}

		//since we have the array now, split the elems according to sessions or items or customer
		for(var i=0; i<matches.length;i++){
			switch(true){

				case matches[i].toLowerCase().indexOf('session') > -1:
					__scd.sessions.push(matches[i]);
				break;

				case matches[i].toLowerCase().indexOf('item') > -1 || matches[i].toLowerCase().indexOf('customfield') > -1 || matches[i].toLowerCase().indexOf('total') > -1 :
					__scd.items.push(matches[i]);
				break;

				case matches[i].toLowerCase().indexOf('customer') > -1:
					__scd.customer.push(matches[i]);
				break;

			}
		}

		//loop through sessions and replace with razor fields
		if(__scd.sessions.length > 0){
			 __scd.shtml += '@{\n';
			for(var i=0; i<__scd.sessions.length;i++){
				var val = __scd.sessions[i];
				var new_session = '@(' + val.replace(':', '_')  + ')';
				var old_session = '[[' + val + ']]';
				__scd.html = __scd.html.replace(old_session, new_session);
				var temp = 'var ' + val.replace(':', '_') + '= @TryGetSessionField("' + val.split(':')[1] + '");\n';
				__scd.shtml.indexOf(temp) <= -1 ?__scd.shtml += temp : "";
			}
			__scd.shtml += '}\n';
	    }


		//loop through customer fields and replace with razor fields
		if(__scd.customer.length > 0){
			for(var i=0; i<__scd.customer.length;i++){
				var val = __scd.customer[i];
				if(val.toLowerCase() in __sco.placeholders){
					var old_item = '[[' + val + ']]';
					if(val.toLowerCase() == 'customername'){ __scd.chtml += '@{var salutation = "there"; if(Model.Customer != null && string.IsNullOrEmpty(Model.Customer.FirstName) == false) { salutation = String.Format("{0}", Model.Customer.FirstName); }}' }
					__scd.html = __scd.html.replace(old_item, __sco.placeholders[val.toLowerCase()]);
				}
			}
		}


		//insert sessionfields/customer fields right after body tag
		var bodytag = __scd.html.match(/\<body.*\>/gi)[0] ;
		var temp = __scd.html.split(__scd.html.match(/\<body.*\>/gi)[0]);
		__scd.html = temp[0] + bodytag + '\n' + __scd.shtml + __scd.chtml + temp[1]; 

		

		//loop through item fields and replace with razor fields
		if(__scd.items.length > 0){
			__scd.ihtml += '@{\n';
			for(var i=0;i<__scd.items.length;i++){
				var val = __scd.items[i];
				if(val.indexOf(':') > -1){
					var temp = 'var ' + val.replace(':', '_') + '= @TryGetItemField(@product, ' + '"' + val.split(':')[1] + '");\n';
					__scd.ihtml.indexOf(temp) <= -1 ?__scd.ihtml += temp : "";
					var new_item = '@(' + val.replace(':','_') + ')';
					var old_item = '[[' + val +  ']]';
					__scd.html = __scd.html.replace(old_item, new_item);
				}else{
					if(val.toLowerCase() in __sco.placeholders){
						switch(true){

							case val.toLowerCase().indexOf('customfield1') > -1:
								var old_item = '[[' + val + ']]';
								var new_item = '@(' + val + ')';
								var temp = 'var ' + val + '= @TryGetItemField(@product, \"f1\");\n';
								__scd.html = __scd.html.replace(old_item, new_item);
								__scd.ihtml.indexOf(temp) <= -1 ?__scd.ihtml += temp : "";
							break;

							case val.toLowerCase().indexOf('customfield2') > -1:
								var old_item = '[[' + val + ']]';
								var new_item = '@(' + val + ')';
								var temp = 'var ' + val + '= @TryGetItemField(@product, \"f2\");\n';
								__scd.html = __scd.html.replace(old_item, new_item);
								__scd.ihtml.indexOf(temp) <= -1 ?__scd.ihtml += temp : "";
							break;

							case val.toLowerCase().indexOf('itemvalue') > -1:
								var old_item = '[[' + val + ']]';
								var new_item = __sco.placeholders[val.toLowerCase()];
								var temp = 'var item_pricedouble = 0.00; item_pricedouble = @product.Price; var item_price = Math.Round(item_pricedouble, 2).ToString(\"0.00\");\n';
								__scd.html = __scd.html.replace(old_item, new_item);
								__scd.ihtml.indexOf(temp) <= -1 ?__scd.ihtml += temp : "";
							break;

							case val.toLowerCase().indexOf('totalprice') > -1:
								var old_item = '[[' + val + ']]';
								var new_item = __sco.placeholders[val.toLowerCase()];
								var temp = 'var item_totalpricedouble = 0.00; item_totalpricedouble = @product.Price * @product.Quantity; var item_totalprice = Math.Round(item_totalpricedouble, 2).ToString(\"0.00\");\n';
								__scd.html = __scd.html.replace(old_item, new_item);
								__scd.ihtml.indexOf(temp) <= -1 ?__scd.ihtml += temp : "";
							break;

							default:
								var old_item = '[[' + val + ']]';
							__scd.html = __scd.html.replace(old_item, __sco.placeholders[val.toLowerCase()]);
							break;
						}
					}
				}
			}
			__scd.ihtml += '}'
		}



		//replace the product list start and end
		//old regex /\[\[productlist:start*\S+\s+(\<tr\>)/gim
		//new regex /\[\[productlist:start\]\]\s*(((?!\[start\]|\[end\]).)+)\s*\<tr\>/gmi
		__scd.html = __scd.html.replace(/\[\[productlist:start\]\]\s*(((?!\[start\]|\[end\]).)+)\s*\<tr\>/gmi, '@foreach(var product in Model.Products){\n<tr>\n' + __scd.ihtml);
		__scd.html = __scd.html.replace(/\[\[productlist:end\]\]/gi, '}');



		//set the value in editor 2
		__sco.editor2.setValue(__scd.html);
		$('#copy_text').val(__scd.html);
	}
}