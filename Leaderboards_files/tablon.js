






// Seconds -> Hours, Minutes, Secods
function print_remaining(seconds){
	var hours   = Math.floor(seconds / 3600);
	var minutes = Math.floor((seconds - (hours * 3600)) / 60);
	var seconds = seconds - (hours * 3600) - (minutes * 60);
	var result = '';
	if(hours > 0) result += hours + " hours ";
	if(minutes > 0) result += minutes + " minutes ";
	result += seconds + " seconds";
	return result;
}






// type: end, time
function Countdown(type,time_or_end,timeupdate,update_handler,end_handler){

	// Constructor
	if(type == 'time'){
		this.end = Math.floor( (new Date().getTime() + time_or_end) / 1000 ) ;
	} else {
		this.end = time_or_end;
	}

	if(update_handler === undefined) update_handler = function(data){};
	if(end_handler === undefined) end_handler = function(data){};
	this.timeupdate = timeupdate;
	this.update_handler = update_handler;
	this.end_handler = end_handler;


	this.start = function(){
		this.active = true;
		this.update();
	}

	this.timeout = function(){
		var that = this;
		setTimeout(function(){
			that.update();
		}, this.timeupdate);
	}


	this.update = function(){

		if(!this.active) return;
		var now = Math.floor( new Date().getTime() / 1000 );
		var remaining = this.end-now;
		var data = {now:now,end:this.end,remaining:remaining};

		if(remaining > 0){
			this.update_handler(data);
			this.timeout();
		}else{
			this.end_handler(data);
			this.end = Math.floor( (new Date().getTime() + time_or_end) / 1000 ) ;
			this.active = false;

		}


	}


	this.stop = function(){
		this.active = false;
	}
	


}



function countdown_start(end){

	var c = new Countdown('end',end,950,function(data){
		$('#countdown').text(print_remaining(data.remaining));
	},function(){
		$('#countdown').text("-");
	});
	c.start();

}













function autoreload_start(){
	window.tablon_autoreload = true;
	$('#reload').prop('disabled', true);
	$('#clock').show();


	window.autoreload_count = new Countdown('time',59 * 1000,1000,
		function(data){

			$('#clock').html("Reload in " + print_remaining(data.remaining));

		},
		function(data){

			$('#clock').html('Reloading');
			reload();


		});

	window.autoreload_count.start();
}

function autoreload_stop(){
	window.tablon_autoreload = false;
	$('#reload').prop('disabled', false);
	$('#clock').hide();
	window.autoreload_count.stop();

}


function reload_fail(){

	reload_end();

	if(window.tablon_autoreload) autoreload_start();

}



function reload(){

	if(window.tablon_reloading) return;


	window.tablon_reloading = true;


	$('#reload').prop('disabled', true);
	$('#autoreload').prop('disabled', true);
	$('#loader').css('visibility','visible');


	setTimeout(function() {

		var rid = parseInt($('#requesttable > tbody > tr:first').data('rid')) || 0;

		$('#requesttable > tbody > tr').each(function(){

			var row_rid = parseInt($(this).data('rid'));
			var row_final = "True" == $(this).data('statusfinal');

			if(! row_final && row_rid <= rid ){
				rid = row_rid-1;
			}

		});



		$.ajax({
		data: {rid:rid},
		url: "ajax_request_rows?"
		}).done(function(data) {
			addRows(data);
			if(window.tablon_autoreload) autoreload_start()
		}).fail(reload_fail).always(function(){
			window.tablon_reloading = false;
		});

    }, 1500);

}



function reload_end(){

	if( window.tablon_autoreload == false )
		$('#reload').prop('disabled', false);
	$('#autoreload').prop('disabled', false);
	$('#loader').css('visibility', 'hidden');

}


function addRows(data){

	if($.trim(data) == ''){
		reload_end();	
		return;
	}


	// Get the current row id
	var rid = parseInt($('#requesttable > tbody > tr:first').data('rid')) || 0;

	// Create the rows
	var rows = $(data);



	// Update the history (html5)
	try {
		var new_rid = parseInt(rows.eq(0).data('rid')) || 0;
		//document.title = "Tablón rid:" + (new_rid);
		history.replaceState({rid:new_rid}, null, "/#"+new_rid);
	} catch(err){} // Ignore



	// Divide in new and updated
	var new_rows = $();
	var upd_rows = $();

	// Divide the new and old rows
	rows.each(function(){

		if(parseInt($(this).data('rid')) > rid ){
			new_rows = new_rows.add( $(this).clone() );
		} else {
			upd_rows = upd_rows.add( $(this).clone() );
		}

	});


	// Update the rows
	upd_rows.each(function(){

		var new_row = $(this);
		var rid = $(this).data('rid'); // No need to parseInt
		var current_row = $('#requesttable tr[data-rid="'+ rid +'"]');
		//var ncols = $(current_row).find('td').length;


		$(current_row).fadeOut(function(){
			$(this).replaceWith(new_row);
			timestamp_show();
			$(this).fadeIn();
		});


	});


	// Wrapper a hiden div inside the td (tr can not be used with animations) 
	new_rows.children('td').wrapInner('<div style="display: none;">');
	// Add the rows
	new_rows.insertBefore($('#requesttable > tbody > tr:first'));

	timestamp_show();

	// Animate the div inside the tds
	$('td > div').slideDown('slow');

	// Reload end after 700ms, the slidedown last 600 ms
	setTimeout(reload_end, 700);






}






function request_list_start(){


	$( document ).ready(function(){

		// Reset the checkbox
		$('input:checkbox').removeAttr('checked');


		// Autoreload global variable
		window.tablon_autoreload = false;
		window.tablon_reloading = false;

		$('#autoreload').change(function(){

			if($( this ).is( ":checked" )){
				autoreload_start();
			} else {
				autoreload_stop();
			}

		});


		replace_f5(function(){
			if(window.tablon_autoreload == false) reload();
		});


		$('#reload').click(function(){
			reload();
		});

		timestamp_show();


		
		if(window.location.hash) {

			var rid_hash = parseInt(window.location.hash.substring(1));
			var rid_table = parseInt($('#requesttable > tbody > tr:first').data('rid')) || 0;

			//console.log(rid_hash +  " vs " + rid_table);

			if(rid_hash != rid_table){
				console.log("history doesn't cache the DOM");
			}

		}




	});


}








function replace_f5(handler){

	$(document).off("keydown.tablonf5");

	$(document).on("keydown.tablonf5", function(e){

		if ((e.which || e.keyCode) == 116){
			e.preventDefault();
			handler();
		}

	});
}








function update_timestamp(span,ts){


	var ds = Math.floor( moment().diff(ts) / 1000 );

	if(ds < 60 ){
		$(span).html( ds +' seconds' );
		setTimeout(function() { update_timestamp(span,ts); }, 100);
		return;
	} 

	if(	moment().diff(ts,'days') > 0){
		$(span).html( ts.format('MMMM D') );
	} else {
		$(span).html( ts.fromNow(true) );
		setTimeout(function() { update_timestamp(span,ts); }, 1000);
	}
}


function timestamp_show(){

	// Call the update_span for each span
	$( "span[tablontimestamp]" ).each(function(){
		var ts = $(this).attr('tablontimestamp');
		$(this).removeAttr('tablontimestamp');
		ts = moment.unix(parseFloat(ts));
		update_timestamp(this,ts);
	});

}











