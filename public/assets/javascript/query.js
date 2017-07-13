//js used to handle ajax calls

//create redirect links
function createRedirect(src, url) {
 	var a = $("<a>");
 	$("#" + src + "-search").unwrap(a); //remove previous link
    a.attr("href", url);
    a.attr("target", "_blank");
    a.attr("data-toggle","tooltip");
    a.attr("data-placement","top");
    a.attr("title","Redirect me!");

   $("#" + src + "-search").wrap(a); //add link to image
}

//reddit API search
function queryRedditApi() {
	$("#reddit").html("Now Loading...");

	var baseRedditURL = "https://www.reddit.com";
	var searchURL = "/r/" + subreddit
		+ "/search.json?q="
		+ searchTerm + "&";

	var params = {
		restrict_sr: 'true',
		sort: redditSort,
		limit: '10',
		t: redditTime
	}

	//construct url json search
	var queryRedditURL = $.param(params);
	var redditURL = baseRedditURL + searchURL + queryRedditURL;

	$.ajax({
        url: redditURL,
        method: "GET"
      }).done(function(results){
      	redditURL = redditURL.replace(/.json/, ""); //remove json portion
      	
      	createRedirect("reddit", redditURL);

      	$("#reddit").empty(); //clear previous reddit entries
		var response = results.data.children;
		var length = response.length;

		//if no search results
		if (length == 0) {
			$("#reddit").html("No results");
		}

		var ul = $("<ul>");
		ul.attr("id", "thread-list");
		$("#reddit").append(ul);

		for(i=0;i<length;i++) {
			var index = response[i].data;

			if (index.over_18) {
				continue; //skip entry if nsfw
			}

			var redditPost = $("<p>");
			var post = $("<a>");
			var p = $("<p>");			
			var postLink = baseRedditURL + index.permalink;
			var score = "Score: " + index.score + " / ";
			var comments = "Comments: " + index.num_comments + " / ";
			var postDate = "Posted: " + moment.unix(index.created).format("MM-DD-YYYY");

			p.append(score);
			p.append(comments);
			p.append(postDate);
			post.attr("href", postLink); //post url
			post.attr("target", "_blank"); //open in new tab
			post.text(index.title);
			redditPost.append(post);
			redditPost.append(p);

			$("#thread-list").append(redditPost);
		}
	}).fail(function(err) {
		$("#reddit").empty();
		$("#reddit").html("Reddit is busy...");
		queryRedditApi(); //retry reddit
		throw err;
	});
}

//youtube API search
function queryYouTubeAPI() {
	$(".carousel-inner").html("Now Loading");
	$("#youtube-search").html("Videos");
	
	var baseURL = "https://www.googleapis.com/youtube/v3/search?type=video&q="
	+ searchTerm + "+"
	+ youtubeVid + "&";

	var params = {
    	order: 'rating', 
    	topic: 'video',
    	chart: 'mostPopular',
    	videoCategoryId: '20',
    	key: 'AIzaSyAqklXzHz631EsXA4-7YQQ2ys_IJ9pENSs', 
    	part: 'snippet',
    	relevanceLanguage: 'en'
	};

	var query = $.param(params);
	var queryURL = (baseURL + query);

	console.log(queryURL);

	$.ajax({
		url: queryURL,
		method: "GET"
	}).done(function(response){
		
		createRedirect("youtube", "https://www.youtube.com/results?search_query=" + searchTerm);
		
		//empty carousel on each search
		$(".carousel-inner").empty();
		$(".carousel-indicators").empty();

		//assign minimum number of videos to display
		var length = Math.min(5, response.items.length)

		var idList = [];
		//push videos to idList
		for (var i=0;i<length;i++){
			var videoId = response.items[i].id.videoId;
			idList.push(videoId);
		}

		for (var i=0;i<idList.length;i++){
			
			var li = $("<li>");
			//build carousel target lists
			li.attr("data-target","#videos");
			li.attr("data-slide-to", i);
			//set index 0 to active
			if (i == 0){
				li.addClass("active");
			}
			
			$(".carousel-indicators").append(li);

			var div = $("<div>");
			//build carousel items
			div.addClass("item text-center");
			//set index 0 to active
			if (i == 0){
				div.addClass("active");
			}

			var videoTag = $("<iframe>");
			//build video iframe
			videoTag.attr("width","480");
			videoTag.attr("height","270");
			videoTag.attr("src","https://www.youtube.com/embed/"+idList[i]);
			videoTag.attr("frameborder","0");
			videoTag.attr("allowfullscreen","");
			videoTag.attr("alt","Video-" + i);
			
			
			div.append(videoTag);

			$(".carousel-inner").append(div);

		}	
	}).fail(function(err) {
	  	throw err;
	});
}

//giantbomb api
function queryGiantBombAPI() {

	$.ajax({
        url: "https://www.giantbomb.com/api/search",
        type: "GET",
        data: {
          resources: "game",
          query: searchTerm,
          api_key: "e103ce858ad645534fc1242d90776bf29aefe902",
          format: "jsonp",
          crossDomain: true,
          limit: 5,
          field_list: "platforms,name,image,original_release_date,site_detail_url,deck,description",
          json_callback: "giantResults"
        },
        dataType: "jsonp"
      }).done(function(response) {
        //this does not run
        console.log("This is not supposed to run");
      });
}

//giantbomb callback
function giantResults(result) {	
	createRedirect("giant", "https://www.giantbomb.com/search/?q=" + searchTerm);
	$("#game-list").empty(); //empty previous search
	var result = result.results;
	var newResult = [];

	//push results into a new result; removes empty results
	for (var i = 0; i < result.length; i++) {
		if (result && result[i] && result[i].deck == null) { //filter out results with no deck
			continue;
		}
		else { //push results with deck into new results
			newResult.push(result[i]);
		}
	}

	for (var i = 0; i < newResult.length; i++) {	
		var div = $("<div>");
		var img = $("<img>");
		var a = $("<a>");

		var result = newResult[i];
		var platforms = result.platforms;
		var siteLink = result.site_detail_url;
		var releaseDate = moment(result.original_release_date).format("MM-DD-YYYY");

		img.attr("src", result.image.thumb_url);
		div.append(img);
		div.append("<h4>" + result.name + "</h4>");
		div.append("<p>" + result.deck + "</p>");		

		//construct platform string
		var text = "";
		for (var j = 0; j < platforms.length; j++) {
			text +=	platforms[j].name;		

			if (j < platforms.length - 1){ //add comma if not at end of platform list
				text += ", ";
			}
		}
		div.append("<p><b>Platforms:</b> " + text + "</p>");

		div.append("<p><b>Release Date:</b> " + releaseDate + "</p>");
		//create site link
		a.attr("href", siteLink);
		a.attr("target", "_blank");
		a.attr("id", "link" + i);	
		div.append("<b>Link: </b>").append(a);
		div.append("<hr>");

		//write to game info panel
		$("#game-list").append(div);
		$("#link" + i).text(siteLink);
	}
	
}
