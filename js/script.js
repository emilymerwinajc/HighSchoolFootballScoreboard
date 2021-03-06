(function() {
	//var showFuture = false;
	var bodyWidth = $("body").width(), yScale, gameHeight;
	var data1, teamsArr = [], filtered = false, currentDate = new Date();
	currentDate.day = currentDate.getDay();

	if(bodyWidth >= 700){
		d3.selectAll("#chart").attr("class", "tiles four_up");
	} else if(bodyWidth >= 600){
		//d3.selectAll("#chart").attr("class", "tiles three_up"); //this is the default
	} else if(bodyWidth >= 500){
		d3.selectAll("#chart").attr("class", "tiles two_up");
	} else{
		d3.selectAll("#chart").attr("class", "tiles_wrap");
	}

	jQuery.getJSON("http://www.scoreatl.com/xml/scoreboard/hs/json/", function(data) {
	//jQuery.getJSON("data/week1.json", function(data) {
		data1 = data.game;

		for (var i=0; i<data1.length; i++){
			var game = data1[i];
			teamsArr.push(game.home.name);
			teamsArr.push(game.away.name);

			var awayClass = "", homeClass = "", homeScore = parseInt(game.home.score), awayScore = parseInt(game.away.score), startTime = new Date(game.startTime);
			game.startTime = startTime;
			//game.hasStarted = hasGameStarted(startTime);
			game.day = startTime.getDay();
			if(awayScore > homeScore){
				awayClass = "winner";
			} else if(awayScore < homeScore){
				homeClass = "winner";
			}
			game.gameText = "<ul class='team row tiles'><li class='"+awayClass+"'><strong>A: </strong>"+game.away.name+"</li><li class='score "+awayClass+"'>"+awayScore+"</li></ul><hr><ul class='team row tiles'><li class='"+homeClass+"'><strong>H: </strong>"+game.home.name+"</li><li class='score "+homeClass+"'>"+homeScore+"</li></ul><ul class='row tiles meta'><li class='startTime'>"+reformatTimestamp(startTime)+"</li><li class='gameStatus'> "+game.statusText+"</li></ul>";	
		} //for
		doGrid();

		/*if(data1.length > parseInt($("#numScores").text())){
			$('#future').prop('checked', false);//handle browser form caching
			$("#future").change(function() {
			    if(this.checked) {
					showFuture = true;
			    }
				else{
					showFuture = false;
				}
				doGrid();
			});
		}
		else{
			$("#futureDiv").hide();
		}*/
	}); //jQuery.getJson

	function doGrid(){
		var data2, chart = d3.select("#chart").selectAll("li.game");
		filterDays();
		buildGrid();

		function filterDays(){
			if(currentDate.day === 4){
				$("#daySelect").prop("selectedIndex", 2);
				handleDays(4);
			} else if(currentDate.day === 5){
				$("#daySelect").prop("selectedIndex", 3);
				handleDays(5);
			} else if(currentDate.day === 6){
				$("#daySelect").prop("selectedIndex", 4);
				handleDays(6);
			} else{
				$("#daySelect").prop("selectedIndex", 1);
				handleDays(3);
			}
			$("#daySelect").change(function(){
				handleDays(+this.value);
			});

			function handleDays(val){
				if(val === 3){
					data2 = aToZ(data1);
				} else{
					data2 = aToZ(data1.filter(function(d){return d.day === val}));//if we were checking for games that have started we wouldn't need to run aToZ() here since it happens in aToZ() as well... or maybe we could remove it from that func instead
				}
				filterGames(data2);
			}
		}//filterDays

		function buildGrid(){
			$("#searchBox").val(""); //clear any left over searches
			teamsArr = teamsArr.sort();
			//data2 = checkFuture(); //this is broken but can probably be fixed by calling checkFuture(data2) instead (func will also need to be updated to receive passed array)
			d3.select("#numScores").text(data2.length);
			var tempChart = chart.data(data2, function(d){ return d.away.name; });

			tempChart.exit().remove(); //we will call this again when "show later games" is toggled so we will need to removed the later ones here

			tempChart.enter().append("li")
				.attr("class", "game")
				.html(function(d) { return d.gameText; });
		}//buildGrid

		$("#searchBox").autocomplete({
			source: teamsArr,
			select: function(event, ui){
				doSearchBox(ui.item.value);
			}
		}).keydown(function(e){
			if(e.keyCode === 13){
				doSearchBox(new RegExp ($("#searchBox").val(), "i"));//make case insensitive
				$(e.target).autocomplete("close");//since no selection was made we need to force close the autocomplete menu
			}
		});

		function doSearchBox(searchTerm){
			filtered = true;
			filterGames(data1.filter(function(d){ return d.home.name.search(searchTerm) !== -1 | d.away.name.search(searchTerm) !== -1; })); //include partial matches
		}

		$("#resetBtn").click(function(){
			if(filtered){
				d3.selectAll("li.game").remove(); //get rid of any search items on display
				filtered = false; 
				buildGrid();
			} else if($("#searchBox").val() !== ""){ //if text is entered in the search box but nothing is selected, clear search box
				$("#searchBox").val(""); 
			}
		});

		function filterGames(newdata){
			d3.select("#numScores").text(newdata.length);

			var chart2 = d3.select("#chart").selectAll("li.game")
				.data(newdata, function(d){ return d.away.name; });

			d3.transition(chart2.exit())
				.remove();

			chart2.enter().append("li")
				.attr("class", "game")
				.html(function(d){ return d.gameText; });
		}//filterGames
	}//doGrid

	function reformatTimestamp(timestamp) {
		var format = d3.time.format("%-I:%M %p"+" "+"%-m/%-d/%y");
		return format(new Date(timestamp));
	}
	/*function checkFuture(){
		if(showFuture){
			return aToZ(data1);
		}
		else{
			//if the game hasn't started don't show it. Because UTC time counts up we want our start timestamp to be smaller than the current timestamp 
			var temp = data1.filter(function(d){return d.hasStarted});
			return aToZ(temp);
		}
	}*/
	function aToZ(data){
		return data.sort(function (a, b) {
		   	if (a.away.name > b.away.name){ return 1; }
		   	if (a.away.name < b.away.name){ return -1; }
			// a must be equal to b
			return 0;
		});
	}
	function hasGameStarted(startTime){
		return startTime <= currentDate.getTime();
	}
}());