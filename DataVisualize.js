d3.select(window).on('resize', resize);

var width = 1920, height = 1000;
var timeFormat = d3.timeFormat("%Y %b");
var circle_clicked = false;
var map_clicked = 0;


var dflt_radius = window.innerWidth>=1080? 2.5: 1.8,
	high_radius = window.innerWidth>=1080? 3.5: 2.8,
	int_radius = window.innerWidth>=1080? 4 : 3.3,
	war_radius = window.innerWidth>=1080? 2.5 : 1.8;

var parseTime = d3.timeParse("%Y-%m")

var zoom = d3.zoom()
    .scaleExtent([1, 10])
    .on("zoom", zoomed);
	
var svg = d3.select('#main').append('svg')
	.attr('width', '100%')
	.attr('height', '100%')
	.call(zoom);

var g_map = svg.append('g')
	
var boardSVG_circle = d3.select('#board_time').append('div').attr('class','circleWrapper').append('svg').attr('height','100%').attr('width','100%').style('overflow','auto').attr('id','boardCircle');
var boardSVG = d3.select('#board_time').append('div').attr('class','timeWrapper').append('svg').attr('height', '100%').attr('width', '100%').style('overflow','auto').attr('id','boardMain');

var bm_width = d3.select('#boardMain').style('width').replace('px','');
var bm_height = d3.select('#boardMain').style('height').replace('px','');

var projection = d3.geoMercator();
	window.innerWidth>=1080? projection.scale(240): projection.scale(130);
	window.innerWidth>=1080? projection.center([0, 35]): projection.center([120,-50])
	projection.translate([width/2 -180 , height/2-50]);

var path = d3.geoPath().projection(projection);

var timeScale = d3.scaleTime()
  .domain([new Date('1946-03'), new Date('1991-12-31')])
  .range([0, bm_width-10])
 

var map_timeScale = d3.scaleTime()
  .domain([new Date('1946-03'), new Date('1991-12-31')])
  .range([0, 250])
  .clamp(true);

var timeZoom = d3.zoom().scaleExtent([1, 10])
.translateExtent([[0, 0], [Infinity, 0]])
      .on('zoom', timeZoomed )

var timeAxis = d3.axisTop(timeScale)
				 .tickFormat(timeFormat)
			     .tickSize(6)
			     .tickPadding(10)
 window.innerWidth >= 1080?
   timeAxis.ticks(4)
   :timeAxis.ticks(3);


var map_timeAxis = d3.axisTop(map_timeScale).ticks(4)
					.tickFormat(timeFormat).tickSize(0);


var brush = d3.brushX()
	.extent([[0,15],[bm_width-10,bm_height]])
    .on("brush", brushed);


var boardAxisSVG = d3.select('#board_axis').append('svg')
	.attr('transform','translate(60, 0)')
	.attr('width', '100%')
	.attr('height', 65);

var boardBrushSVG = d3.select('#board_axis').append('svg')
	.attr('transform','translate(60, -8)')
	.attr('width', '100%')
	.attr('height', 1200)
	.style('pointer-events', 'none');

var brushableG = boardBrushSVG.append('g').classed('brushable',true)
	.attr('transform','translate(0,-30)')
	.call(brush);

brushableG.select('.selection').attr('fill-opacity', 0.18).attr('height', 690);
brushableG.select('.handle').attr('height',690);
brushableG.select('.overlay').attr('width', bm_width-10).attr('height', 70);

var title = d3.select('#main').append('div').attr('class', 'titleDIV');

title.append('h1').attr('class', 'mainTitle').text('World Militarized Interstate Disputes and Wars ')
title.append('span').attr('class', 'subTitle').attr('y', 60).text('Since after the World War II until the fall of the Soviet Union (1946 - 1991)');

var borderSlider = d3.select('#main').append('div').attr('class', 'borderDiv').append('svg').attr('height',45).append('g').classed('slider',true).attr('transform', 'translate(3,30)')

borderSlider.append('line').attr('x1', map_timeScale.range()[0]).attr('x2', map_timeScale.range()[1]).style('stroke-width', "2px").style('stroke', '#b8ccd8')
	.select(function(){return this.parentNode.appendChild(this.cloneNode(true));})
	.attr('style', null)
	.attr('class', 'track-overlay')
	.call(d3.drag()
        .on("start.interrupt", function() { borderSlider.interrupt(); })
        .on("start drag", function(){ dragged(map_timeScale.invert(d3.event.x)); }));

var handle = borderSlider.insert("line", ".track-overlay")
    .attr("class", "handle")
    .style('stroke', 'black')
    .style('stroke-width', 1)
    .attr('x1', 0)
    .attr('y1', -6)
    .attr('x2',0)
    .attr('y2', 6);

var borderText = d3.select('.borderDiv').select('svg').append('text').attr('y', 18).attr('x',3).text('Border lines based on: 1991 Dec');

var legends = d3.select('#main').append('div').attr('class', 'legendDiv').append('svg').attr('width', '200%')
var legends_2 = d3.select('#main').append('div').attr('class', 'legendDiv2').append('svg').attr('width', '100%').attr('height', '60px');

var axisG = boardAxisSVG.append('g')
   .attr('class', 'x axis')
   .attr('transform','translate(0, 55)')
   .call(timeAxis);

d3.selectAll('.x.axis').selectAll('text').classed('tick_text', true)

var timeZoomBox = boardAxisSVG.append('rect').classed('timezoom',true).attr('y',10).attr('width',bm_width-10).attr('height', 55)
	.style('opacity', 0)
	.style('cursor', 'all-scroll' )
	.call(timeZoom);


var infoDIV = d3.select('#board_info');
var chartSVG = infoDIV.select('#info4').append('svg').attr('id', 'chartSVG')

var Drag_info = d3.select('.timeWrapper').append('div')
.attr('id', 'drag_info')
.append('span').style('margin-right', '15px').style('margin-top', '15px')

var Zoom_info = d3.select('#board_axis').append('div')
.attr('id','zoom_info')
.append('span').style('margin-right', '15px').style('margin-top', '10px')

var timeRectsG = boardSVG.append('g').classed('timeRects',true)

var newScale, map_newScale, initial_features,
    range, 
    storedValue = [0, bm_width-10],
    storedSelection1, storedSelection2, data, trade;

var hostileStringScale = d3.scaleOrdinal().domain([2,3,4,5]).range(['T','D','U','W'])

var fatalityScale = d3.scaleLinear().domain([-9,0,6]).interpolate(d3.interpolateHcl)
					.range([d3.rgb('#000000'),d3.rgb('#4c0000'), d3.rgb('#ed0202')])

var fatalityStringScale = d3.scaleOrdinal().domain([-9,0,1,2,3,4,5,6]).range(['Unknown','None','1-25 deaths','26-100 deaths','101-250 deaths','251-500 deaths','501-999 deaths','1000 deaths or more'])
var hostilityStringScale = d3.scaleOrdinal().domain([2,3,4,5]).range(['Threat to use military force', 'Display of military force', 'Use of military force', 'War']) 

var frequencyScale = d3.scaleLinear().domain([1,51]).rangeRound([1,10]).clamp(true);

var freqColorScale = d3.scaleLinear().domain([1,10]).interpolate(d3.interpolateHcl)
					.range([d3.rgb('#ffe7c4'), d3.rgb('#fc7149')])

				
var freqStrokeScale = d3.scaleLinear().domain([1,10]).interpolate(d3.interpolateHcl)
					.range([d3.rgb('#d3a67e'), d3.rgb('#9e4329')])

var fltr_circles, fltr_circles_war, fltr_circles_int, fltr_circles_int_allied, fltr_circles_int_hostile, fltr_circles_int_war;		


d3.select('#board_header').append('div')
.style('width','75px')
.style('line-height', 2)
.style('position','absolute')
.style('right', '20px')
.style('margin-top', '3px')

var circleTip = d3.tip()
				.attr('class', 'd3-tip')
	  			.offset([-10, 0])
	  			.html(function(d) {
	    		return d.war ==0? '<span style="color:white">' +'Dispute #'+ d.DispNum + "</span>" : '<strong><span style="color:white">' + d.war_name + "</span>" });

var countryTip =  d3.tip()
				.attr('class', 'd3-tip_country')
	  			.offset([-5, 0])
	  			.html(function(d) {
	    		return  '<strong><span style="color:white">'+ d.properties.CNTRY_NAME + "</span>"  });

var circleTip_drawn = d3.tip()
						.direction('w')
						.attr('class', 'd3-tip')
						.offset([0, -10])
						.html(function(d) {
			    		return d.war ==0? '<span style="color:white">' +'Dispute #'+ d.DispNum + "</span>" : '<strong><span style="color:white">' + d.war_name + "</span>" });

var typologyTip = d3.tip()
				  .attr('class','d3-tip_typology')
				  .offset([-60,-12])
				  .html(function(d){ 
				  	return '<span style ="color:white">'+'<b><span style ="color:#f4c242">Militarized Interstate Disputes (MID)</b></span> are united historical cases of conflict in which the threat,</br> display or use of military force short of war by one member state is explicitly directed towards</br> the government, official representatives, official forces, property, or territory of another state.</br> Disputes are composed of incidents that range in intensity from threats to use force to actual <br>combat short of war </strong>(Jones et al. 1996: 163).<br><br> An <b><span style ="color:#f4c242">interstate war</b></span> must have: sustained combat involving regular armed forces on both sides<br> and 1,000 battle-related fatalities among all of the system members involved. Any individual<br>member state qualified as a war participant through either of two alternative criteria: a minimum<br> of 100 fatalities or a minimum of 1,000 armed personnel engaged in active combat (Resort to<br>Arms, 56).'});

var fatalityTip = d3.tip()
  		.attr('class', 'd3-tip')
  		.offset([-10, 0])
  		.html(function(d) {
    	return '<strong><span style="color:white">' + fatalityStringScale(d) + "</span>" });

var hostilityTip = d3.tip()
.attr('class', 'd3-tip')
  		.offset([-10, 0])
  		.html(function(d) {
    	return '<strong><span style="color:white">' + hostilityStringScale(d) + "</span>" });

g_map.call(circleTip);
g_map.call(countryTip);
boardSVG_circle.call(circleTip_drawn);
legends.call(typologyTip);

var options = {
	data: function(){
		var countryList = [];
		d3.csv("~COW_country_codes.csv", 
		function(countries){
				for(var i = 0; i <= countries.length-1; i++){
				countryList.push(countries[i].StateNme)
			}
		})
	return countryList
	}(),

	list: {
		match: {
			enabled: true
		}
	}
};

$("#search").easyAutocomplete(options);
d3.select('input#search').attr('placeholder', 'Enter country name.')
d3.select('div.easy-autocomplete').style('width', '150px')
d3.select('input#search').style('width','150px')
d3.queue()
	.defer(d3.json, "~worldmap.geojson")//world map
	.defer(d3.csv, "~MIDB_4.01.csv")
	.defer(d3.csv, "~MIDA_4.01.csv")
	.defer(d3.csv, "~MIDLOC_1.1+war.csv")
	.awaitAll(drawFirst);

function drawFirst(error, files){

//parse the dataset

data = d3.nest().key(function(d){ return d.DispNum3;}).entries(files[1])
var data_2 = files[2], 
	data_3 = files[3];

for (var i = 0; i<= data.length-1; i++){

		data[i].countries_A = [];
		data[i].countries_B = [];
		for(var j = 0; j <= data[i].values.length-1; j++){
			
			if(data[i].values[j].SideA == 1){
				data[i].countries_A.push(data[i].values[j].ccode);
			}
			else{
				data[i].countries_B.push(data[i].values[j].ccode);	
			}
		}
		data[i].DispNum = data_2[i].DispNum3;
		data[i].StYear = data_2[i].StYear;
		data[i].StMon = data_2[i].StMon;
		data[i].EndYear = data_2[i].EndYear;
		data[i].EndMon = data_2[i].EndMon;
		data[i].lat = data_3[i].latitude;
		data[i].lon = data_3[i].longitude;
		data[i].war = data_3[i].war;
		data[i].war_name = data_3[i].war_name;
		data[i].Start = data[i].StYear + '-' + data[i].StMon
		data[i].End = data[i].EndYear + '-' + data[i].EndMon
		data[i].Fatality = data_2[i].Fatality
		data[i].HostLev = data_2[i].HostLev

		delete data[i].key;
		delete data[i].values;
	}


initial_features = files[0].features.filter(function(d){return d.properties.				   COWCODE !== -1 && d.properties.COWSYEAR <= 1991})

dragged(new Date('1988-12-31'));

var circles = g_map.selectAll('circle')
			 .data(data)
			 .enter()
			 .append('circle')			 
			 .attr('cx', function(d){return projection([d.lon,d.lat])[0]} )
			 .attr('cy', function(d){return projection([d.lon,d.lat])[1]} )
			 .attr('r', 0)
			 .attr('class', function(d){return d.war==0? 'dispute circleNotClicked' : 'circleNotClicked war opaque'})
			 .on('mouseover', mouseoverCircle)
			 .on('mouseout', mouseoutCircle)
			 .on('click', selectCircle)
			 .transition()
			 .delay(function(d, i){return i*0.2})
			 .duration(1000)
			 .attr('r', 3.5)
			 .transition()
			 .duration(500)
			 .attr('r', function(d){return d.war==0? dflt_radius : war_radius });

boardSVG_circle.attr('height', function(d){return data.length*40.2+7});
boardSVG.attr('height', function(d){return data.length*40.2+70});	

boardSVG_circle.selectAll('circle').data(data.sort(sortByDateAscending))
	.enter().append('circle').attr('class', function(d){return d.war==0?'circleDrawn':'circleDrawn_war'}).attr('cx', 30).attr('cy', function(d,i){return i*40 + 25} ).attr('r',0).style('stroke',function(d){return d3.select(this).classed('circleDrawn')? '#fff' : '#014e66'  })
	.on('mouseover', mouseoverCircle_board)
	.on('mouseout', mouseoutCircle_board)
	.on('click', selectCircle_board)
    .transition()
	.duration(1000)
	.attr('r', 12);;

timeRectsG.selectAll('rect')
		.data(data.sort(sortByDateAscending))
		.enter()
		.append('rect')
		.attr('x', function(d){return newScale==undefined ? timeScale(parseTime(d.Start)) : newScale(parseTime(d.Start))})
		.attr('width', 0)
		.attr('y', function(d,i){return i*40 + 12.5})
		.attr('class', 't_rects')
		.transition()
		.duration(700)
		.style('fill', function(d){return fatalityScale(d.Fatality).toString()})
		.attr('width',
			 function(d){return newScale == undefined? d3.max([timeScale(parseTime(d.End)) - timeScale(parseTime(d.Start)),1]) : d3.max([newScale(parseTime(d.End)) - newScale(parseTime(d.Start)),1])})
		.attr('height', 24)

timeRectsG.selectAll('text')
		.data(data.sort(sortByDateAscending))
		.enter()
		.append('text').classed('hostText',true)
		.attr('x', function(d){return newScale==undefined ? 10 + timeScale(parseTime(d.Start)) + d3.max([timeScale(parseTime(d.End)) - timeScale(parseTime(d.Start)),1])
									: 3 + newScale(parseTime(d.Start)) + d3.max([newScale(parseTime(d.End)) - newScale(parseTime(d.Start)),1])})
		.attr('y', function(d,i){return i*40 + 12.5 + 15})
		.text(function(d){return hostileStringScale(d.HostLev)})

brushableG.select('.selection').style('height', d3.select('.timeWrapper').property('clientHeight')+10);
brushableG.select('.handle').style('height', d3.select('.timeWrapper').property('clientHeight')+10);


drawLegends();


d3.select('#time_legend').append('svg')
.attr('width','100%').attr('height', '100%').call(fatalityTip).call(hostilityTip)
.selectAll('rect')
.data([-9,0,1,2,3,4,5,6])
.enter().append('rect')
		.attr('x', function(d,i){return i*16.5 + parseInt(bm_width)-86.5})
		.attr('y', 8)
		.attr('width',16)
		.attr('height', 16)
		.style('fill', function(d){return fatalityScale(d)})
		.style('cursor','pointer')
		.on('mouseover', fatalityTip.show)
		.on('mouseout', fatalityTip.hide)
		.on('click', filterByFatality);


d3.select('#time_legend').select('svg').append('text').attr('id','fatality_level')
	.text('Fatality level')
	.attr('x', parseInt(bm_width)-172)
	.attr('y', 20)
	
d3.select('#time_legend').select('svg').append('text')
	.text('H')
	.attr('x', parseInt(bm_width)+ 48)
	.attr('y', 20)
	.style('opacity',0.5)
d3.select('#time_legend').select('svg').append('text')
	.text('L')
	.attr('x', parseInt(bm_width)- 98)
	.attr('y', 20)
	.style('opacity',0.5)

d3.select('#time_legend').select('svg').append('g').selectAll('rect').data([2,3,4,5])
.enter().append('rect')
.attr('x', function(d,i){return i*19 + parseInt(bm_width)-86.5})
.attr('y', 32)
.attr('height', 16)
.attr('width',16)
.style('fill', '#fff').style('opacity', 0.5)
.style('cursor','pointer')
.style('stroke-width', 1)
.style('stroke', 'black')
.on('mouseover', hostilityTip.show)
.on('mouseout', hostilityTip.hide)
.on('click', filterByHostility)

d3.select('#time_legend').select('svg').append('text').attr('id','hostility_level')
	.text('Hostility level')
	.attr('x', parseInt(bm_width)-176)
	.attr('y', 45)

d3.select('#time_legend').select('svg').append('text')
	.text('H')
	.attr('x', parseInt(bm_width)-8)
	.attr('y', 45)
	.style('opacity',0.5)
d3.select('#time_legend').select('svg').append('text')
	.text('L')
	.attr('x', parseInt(bm_width)- 98)
	.attr('y', 45)
	.style('opacity',0.5)


d3.select('#time_legend').select('svg').append('g').selectAll('text')
	.data(['T','D','U','W'])
	.enter().append('text')
	.text(function(d){return d})
	.attr('x', function(d,i){return i*19 + parseInt(bm_width)-83})
	.attr('y', 45)
	.style('opacity',0.6)
	.style('pointer-events', 'none')



infoDIV.select('#info1').html('No selection').style('opacity',0.75);
infoDIV.select('#info2').html('Total count of MID/War : ')
infoDIV.select('#info2_cont').html('<b>'+g_map.selectAll('.dispute.circleNotClicked,.war.circleNotClicked').data().length)
infoDIV.select('#info3').html('')
infoDIV.select('#info3_cont').html('');

drawCharts();

d3.select('.easy-autocomplete-container').selectAll('li').on('click', countrySearch)

}

function mouseoverMap(d){
 
  if (!d3.select(this).classed('mapClicked') && !d3.select(this).classed('mapHighlighted') ){
   d3.select(this).classed('mapHovered', true );
   countryTip.show(d);
  }
  
}

function mouseoutMap(d){
	if (!d3.select(this).classed('mapClicked') && !d3.select(this).classed('mapHighlighted')){
	d3.select(this).classed('mapHovered', false ).classed('mapNotClicked',true);
	 countryTip.hide(d);
	}
  
}

function mouseoverCircle(d){

	if (map_clicked == 0){


		if(!d3.select(this).classed('circleFiltered')){
			d3.select(this).attr('r', dflt_radius + 1);
			circleTip.show(d);
		}

		if( d3.select(this).classed('circleFiltered')){
			d3.select(this).attr('r', dflt_radius + 2);
			circleTip.show(d);
		}


	}

	else if(map_clicked == 1){

		if((d3.select(this).classed('circleHighlighted')||d3.select(this).classed('circleHighlighted_war')) && !d3.select(this).classed('circleFiltered')){
			d3.select(this).attr('r', high_radius + 1);
			circleTip.show(d);
		}

		if((d3.select(this).classed('circleHighlighted')||d3.select(this).classed('circleHighlighted_war')) && d3.select(this).classed('circleFiltered')){
			d3.select(this).attr('r', high_radius + 2);
			circleTip.show(d);
		}


	}
	else {

		if(d3.select(this).classed('intersected')&& !d3.select(this).classed('circleFiltered')) {
			d3.select(this).attr('r', int_radius + 1 );
			circleTip.show(d);
		}

		if(d3.select(this).classed('intersected')&& d3.select(this).classed('circleFiltered')) {
			d3.select(this).attr('r', int_radius + 2 );
			circleTip.show(d);
		}
	}
  

}


function mouseoutCircle(d){

	if (!d3.select(this).classed('circleClicked')){


		if (map_clicked == 0){

			if(!d3.select(this).classed('circleFiltered')){
				d3.select(this).attr('r', dflt_radius );
				circleTip.hide(d);
			}

			if( d3.select(this).classed('circleFiltered')){
				d3.select(this).attr('r', dflt_radius + 1);
				circleTip.hide(d);
			}

		}

		else if(map_clicked == 1){

			if((d3.select(this).classed('circleHighlighted')||d3.select(this).classed('circleHighlighted_war')) && !d3.select(this).classed('circleFiltered')){
				d3.select(this).attr('r', high_radius );
				circleTip.hide(d);
			}

			if((d3.select(this).classed('circleHighlighted')||d3.select(this).classed('circleHighlighted_war')) && d3.select(this).classed('circleFiltered')){
			d3.select(this).attr('r', high_radius + 1);
			circleTip.hide(d);
			}

		}
		else {

			if(d3.select(this).classed('intersected')&& !d3.select(this).classed('circleFiltered')){
				d3.select(this).attr('r', int_radius  );
				circleTip.hide(d);
			}

			if(d3.select(this).classed('intersected')&& d3.select(this).classed('circleFiltered')) {
			d3.select(this).attr('r', int_radius + 1 );
			circleTip.hide(d);
		}

		}

 } 
}

function mouseoverCircle_board(d){

   d3.select(this).attr('r', 14 );

   if(!circle_clicked){
	   if (map_clicked == 0){
	   	g_map.selectAll('.dispute,.war').filter(function(d_){return d_.DispNum == d.DispNum })
	   	.transition().duration(150)
	   	.attr('r', dflt_radius + 2);
	   }

	   else if (map_clicked == 1){
	   	 g_map.selectAll('.circleHighlighted,.circleHighlighted_war').filter(function(d_){return d_.DispNum == d.DispNum })
	   	.transition().duration(150)
	   	.attr('r', high_radius + 2);
	   }
	   else{
	   	g_map.selectAll('.intersected').filter(function(d_){return d_.DispNum == d.DispNum })
	   	.transition().duration(150)
	   	.attr('r',int_radius + 2);
	   }

	  circleTip_drawn.show(d);
	}
}

function mouseoutCircle_board(d){

	d3.select(this).attr('r', 12);

	if(!circle_clicked){
		 if (map_clicked == 0){
	   	g_map.selectAll('.dispute,.war').filter(function(d_){return d_.DispNum == d.DispNum })
	   	.transition().duration(150)
	   	.attr('r', dflt_radius);
	     }
	     else if (map_clicked == 1){
	   	 g_map.selectAll('.circleHighlighted,.circleHighlighted_war').filter(function(d_){return d_.DispNum == d.DispNum })
	   	.transition().duration(150)
	   	.attr('r',high_radius);
	    }
	    else{
	   	g_map.selectAll('.intersected').filter(function(d_){return d_.DispNum == d.DispNum })
	   	.transition().duration(150)
	   	.attr('r', int_radius);
	    }

	  circleTip_drawn.hide(d); 
	}
}

function selectCircle(d){

	dragged(new Date(d.End));
	legends_2.selectAll('.legendRects').remove();
	g_map.selectAll('.map').classed('mapFiltered',false).attr('style',null);
	 
	 var scrollHeight = boardSVG_circle.selectAll('circle')
	 					.filter(function(d_){return d_.DispNum == d.DispNum }).property('cy').animVal.value - bm_height/2
	 

	if (!circle_clicked ){
	 g_map.selectAll('path.map').attr('class', null).classed('map mapNotClicked',true);
	 highlight(d.countries_A, d.countries_B, d);
	

	 d3.select(this).classed('dispute')?
	 	 d3.select(this).classed('circleNotClicked', false)
	 	 .classed('circleClicked', true):
	 	 d3.select(this).classed('circleNotClicked', false)
	 	 .classed('circleClicked_war', true)

		 

	 twinkle(d3.select(this));

	 
	 d3.select('#board_time').transition().duration(1200).tween('scroll', scrollTopTween(scrollHeight));

	 boardSVG_circle.selectAll('circle').filter(function(d_){return d_.DispNum == d.DispNum}).classed('circleClicked',true).call(twinkle_big)

	 circle_clicked = true;
	 describe(d3.select(this))
	}
	else{
		if ( d3.select(this).classed('circleClicked')||d3.select(this).classed('circleClicked_war') ){
			g_map.selectAll('path.map').attr('style', null).classed('map mapNotClicked', true).classed('mapHighlighted', false);


			g_map.selectAll('.circleClicked,.circleClicked_war').transition().attr('r', dflt_radius);
		

			circle_clicked = false;
			map_clicked = 0;
			initialize();

		}
		else{

			 d3.select('#board_time').transition().duration(1200).tween('scroll', scrollTopTween(scrollHeight));

			g_map.selectAll('path.map').attr('class', null).attr('style', null).classed('map mapNotClicked',true);
			 highlight(d.countries_A, d.countries_B, d);

			var temp = g_map.selectAll('.circleClicked,.circleClicked_war')
			.classed('circleClicked',false).classed('circleClicked_war',false)

			map_clicked ==0? temp.classed('circleNotClicked', true) : temp.classed('circleNotClicked',false);
			
			temp.transition().attr('r', function(d){return map_clicked ==0? dflt_radius: map_clicked ==1? high_radius:  int_radius})

			 d3.select(this).classed('dispute')?
		 	 d3.select(this).classed('circleNotClicked', false)
		 	 .classed('circleClicked', true):
		 	 d3.select(this).classed('circleNotClicked', false)
		 	 .classed('circleClicked_war', true)
			

			 twinkle(d3.select(this));
			 boardSVG_circle.selectAll('.circleClicked').classed('circleClicked', false).transition().attr('r',12);
			 boardSVG_circle.selectAll('circle').filter(function(d_){return d_.DispNum == d.DispNum}).classed('circleClicked',true).call(twinkle_big)
			 
			 describe(d3.select(this));

		}

	}

}

function selectCircle_board(d){

	dragged(new Date(d.End));
	legends_2.selectAll('.legendRects').remove();
	g_map.selectAll('.map').classed('mapFiltered',false).attr('style',null);
	
	if (!circle_clicked ){
	 g_map.selectAll('path.map').attr('class', null).classed('map mapNotClicked',true);
	 highlight(d.countries_A, d.countries_B, d);
	 

	 d3.select(this).attr('class',function(d){return d3.select(this).classed('circleDrawn_war')? 'circleDrawn_war circleClicked_war': 'circleDrawn circleClicked'});

	 twinkle_big(d3.select(this));

	var temp = g_map.selectAll('.dispute,.war').filter(function(d_){return d_.DispNum == d.DispNum }).attr('style',null)

		temp.classed('dispute')? 
		temp.classed('circleClicked', true) : temp.classed('circleClicked_war', true);
		temp.classed('circleNotClicked', false)

	 twinkle(d3.select('.dispute.circleClicked,.war.circleClicked_war'));

	 circle_clicked = true;

	 describe(d3.select(this))
	}
	else{
		if((!d3.select(this).classed('circleClicked')) && (!d3.select(this).classed('circleClicked_war'))) {

			g_map.selectAll('path.map').attr('class', null).attr('style',null).classed('map mapNotClicked',true);
			highlight(d.countries_A, d.countries_B, d);

			var temp = g_map.selectAll('.circleClicked,.circleClicked_war')
			.classed('circleClicked',false).classed('circleClicked_war',false)

			map_clicked ==0? temp.classed('circleNotClicked', true) : temp.classed('circleNotClicked',false);

			temp.transition().attr('r', function(d){return map_clicked ==0? dflt_radius: map_clicked ==1? high_radius:  int_radius});


			boardSVG_circle.selectAll('.circleClicked,.circleClicked_war').classed('circleClicked',false).classed('circleClicked_war',false).transition().attr('r', 12)
		
			d3.select(this).attr('class',function(d){return d3.select(this).classed('circleDrawn_war')? 'circleDrawn_war circleClicked_war': 'circleDrawn circleClicked'});
	 		twinkle_big(d3.select(this));

	 		var temp = g_map.selectAll('.dispute,.war').filter(function(d_){return d_.DispNum == d.DispNum }).attr('style',null)

	 		
	 		temp.classed('dispute')? 
	 		temp.classed('circleClicked', true) : temp.classed('circleClicked_war', true);
	 		temp.classed('circleNotClicked', false)


	 		twinkle(d3.select('.dispute.circleClicked,.war.circleClicked_war'));

	 		
	 		describe(d3.select(this))

		}
		else{

		
			g_map.selectAll('path.mapHighlighted').attr('style', null).classed('map mapNotClicked', true).classed('mapHighlighted', false);

			d3.select(this)
			.classed('circleClicked',false)
			.classed('circleClicked_war',false)
			.classed('circleDrawn',true)
			.transition().attr('r',dflt_radius)

			boardSVG_circle.select('.circleClicked,.circleClicked_war')
			.classed('circleClicked',false)
			.classed('circleClicked_war',false)
			.classed('circleDrawn',true)
			.transition().attr('r',dflt_radius)

			initialize();
			circle_clicked = false;
			map_clicked = 0;

		}	
	

	}
	

}

function scrollTopTween(scrollTop) { 
    return function() { 
        var i = d3.interpolateNumber(document.getElementById('board_time').scrollTop, scrollTop); 
      
        return function(t) { document.getElementById('board_time').scrollTop = i(t);
        	
        }
        	; 
    }; 
} 

function twinkle(circle){

	circle.transition().duration(800).ease(d3.easeSinOut).attr('r', 6).transition().duration(800).ease(d3.easeSinIn).attr('r', 4).on('end', function(){ d3.select(this).call(twinkle); });
}

function twinkle_big(circle){

	circle.transition().duration(800).ease(d3.easeSinOut).attr('r', 16).transition().duration(800).ease(d3.easeSinIn).attr('r', 11).on('end', function(){ d3.select(this).call(twinkle_big); });
}


function selectMap(d){

 fltr_circles = g_map.selectAll('.dispute,.war').filter(function (d_){
	return include(d_.countries_A, d.properties.COWCODE) ||
	  	   include(d_.countries_B, d.properties.COWCODE)});

 fltr_circles_war = g_map.selectAll('.war').filter(function (d_){
	return include(d_.countries_A, d.properties.COWCODE) ||
	  	   include(d_.countries_B, d.properties.COWCODE)});

infoDIV.select('#timeTeller').html('');
brushableG.selectAll('.selection,.handle').classed('transparent', true);


var allCircles, allRects;
	
			if (circle_clicked ){
				
				g_map.selectAll('path.map').attr('style', null).classed('mapNotClicked', true).
				classed('mapClicked', false).classed('mapHighlighted', false);

				g_map.select('.circleClicked').transition().attr('r', dflt_radius)

				
				boardSVG_circle.select('.circleClicked').transition().attr('r', 12);
				initialize();
				map_clicked = 0;
				circle_clicked = false;

			}
				
			else { 

				if (map_clicked == 0){

					
				 	storedSelection1 = d3.select(this).data()[0].properties
				 	
					g_map.selectAll('.dispute.circleNotClicked,.war.circleNotClicked').classed('transparent',true).classed('opaque', false).classed('circleFiltered',false).attr('r', dflt_radius);

					d3.select(this).attr('style', null).attr('class', null).classed('map mapClicked', true);
				
					fltr_circles.attr('style',null)
					.attr('class', function(){return d3.select(this).classed('war')? 'war circleHighlighted_war' : 'dispute circleHighlighted'})
					.classed('opaque', true).classed('transparent',false)
					.transition().attr('r',3.5);
					

					var fltr_pool_hostile = [];
					var fltr_pool_allied = [];

					for (var i = 0; i <= fltr_circles.data().length-1; i++){


						for (var j = 0; j <= fltr_circles.data()[i].countries_A.length-1; j++){

							if(include(fltr_circles.data()[i].countries_A, d.properties.COWCODE) && fltr_circles.data()[i].countries_A[j] !== d.properties.COWCODE.toString()){
								
								fltr_pool_allied.push(fltr_circles.data()[i].countries_A[j])
						
							}

							if(!include(fltr_circles.data()[i].countries_A, d.properties.COWCODE)){

								fltr_pool_hostile.push(fltr_circles.data()[i].countries_A[j])
							}


						}

						for (var j = 0; j <= fltr_circles.data()[i].countries_B.length-1; j++){

							if(include(fltr_circles.data()[i].countries_B, d.properties.COWCODE) && fltr_circles.data()[i].countries_B[j] !== d.properties.COWCODE.toString()){
								
								fltr_pool_allied.push(fltr_circles.data()[i].countries_B[j])
						
							}

							if(!include(fltr_circles.data()[i].countries_B, d.properties.COWCODE)){

								fltr_pool_hostile.push(fltr_circles.data()[i].countries_B[j])
							}	

						}


					}

					var counts_hostile = {}

					fltr_pool_hostile.forEach(function(x) { 
											counts_hostile[x] = (counts_hostile[x] || 0)+1; });

					
					var filtered_map = g_map.selectAll('path.map').filter(function(d){return counts_hostile.hasOwnProperty(d.properties.COWCODE) }).classed('mapFiltered',true);

					filtered_map.style('fill', function(d){return freqColorScale(frequencyScale(counts_hostile[d.properties.COWCODE]))})
								.style('stroke', function(d){return freqStrokeScale(frequencyScale(counts_hostile[d.properties.COWCODE]))})
								.attr('vector-effect', 'non-scaling-stroke')
					
					map_clicked = 1
					
					describe(d3.select(this));
					drawCircle();
					drawLegends(d);
						
				}

				else{

					if(map_clicked == 1){

						if(!d3.select(this).classed('mapClicked'))
						{
							storedSelection2 = d3.select(this).data()[0].properties.COWCODE
							g_map.selectAll('.mapFiltered').style('fill',null).style('stroke',null).classed('map mapNotClicked',true);

							d3.select(this).attr('style', null).attr('class', null).classed('map mapClicked', true);
							
							fltr_circles_int = fltr_circles
								.filter(function()
									{return d3.select(this).classed('circleHighlighted')||d3.select(this).classed('circleHighlighted_war')}
									)
								.attr('class', function(d){return d.war ==0?'dispute intersected' : 'war intersected'})

							fltr_circles_int_allied = fltr_circles_int.filter( function(d_){
								return (include(d_.countries_A, d.properties.COWCODE) && include(d_.countries_A, storedSelection1.COWCODE)) ||
									   (include(d_.countries_B, d.properties.COWCODE) && include(d_.countries_B, storedSelection1.COWCODE))
									}).classed('allied', true);

						
							fltr_circles_int_hostile = fltr_circles_int.filter( function(d_){
								return !(
									   (include(d_.countries_A, d.properties.COWCODE) && include(d_.countries_A, storedSelection1.COWCODE)) ||
									   (include(d_.countries_B, d.properties.COWCODE) && include(d_.countries_B, storedSelection1.COWCODE))
									   )
									}).classed('hostile', true);

							fltr_circles_int_war = fltr_circles
								.filter(function()
									{return d3.select(this).classed('war intersected')}
									);

							

						

							fltr_circles_int.transition().attr('r',2).transition().attr('r',4);


							d3.selectAll('.circleHighlighted,.circleHighlighted_war').attr('style',null).attr('class', function(d){return d.war==0? 'dispute circleNotClicked transparent':'war circleNotClicked transparent' }).attr('r',dflt_radius);	
							
							map_clicked = 2;

							describe(d3.select(this));
							drawCircle();
							drawLegends(d);
							drawTrade(d3.select(this));
							

						}

						else{

							g_map.selectAll('.mapFiltered').style('fill',null).style('stroke',null).classed('map mapNotClicked',true);

							d3.select(this).attr('style', null).classed('mapNotClicked', true).classed('mapClicked',false);

							
							map_clicked = 0;

							drawLegends(d);
							initialize();
												
						}
					}
				    else{


				    	g_map.selectAll('path.map').attr('style', null).classed('mapNotClicked', true).classed('mapClicked', false).classed('mapHighlighted', false);
						
						initialize();

						legends.selectAll('.legend_hostile').remove();
						legends.selectAll('.legend_allied').remove();
											
						circle_clicked = false;
						map_clicked = 0;
						drawLegends(d);

				    }		
				}		
			}
	}


function highlight(a,b,circle_data){

	var a_path = g_map.selectAll('path.mapNotClicked').filter(
		function(d){ return include(a, d.properties.COWCODE)}).classed('mapHighlighted', true)
		a_path.attr('vector-effect', 'non-scaling-stroke').transition()

		.style('fill','#a7dde8')
		.style('stroke','#84afb7')
		

	var b_path = g_map.selectAll('path.mapNotClicked').filter(
		function(d){ return include(b, d.properties.COWCODE)}).classed('mapHighlighted', true)
		b_path.attr('vector-effect', 'non-scaling-stroke').transition()
		
		.style('fill','#fcd48a')
		.style('stroke','#cea471')
		.attr('vector-effect', 'non-scaling-stroke');
	

}


function include(arr, obj) {
    for(var i=0; i<=arr.length-1; i++) {
        if (arr[i] == obj) return true;
    }
}

function zoomed() {
  g_map.attr('transform',d3.event.transform);
}


function drawCircle(){

	var selectedCircles, selectedCircles_war, selectedCircles_merged, selectedCircles_allied, selectedCircles_hostile, data_intersected;
	var newBind_circle, newBind_rect, newBind_text;

	if (map_clicked == 1){

		selectedCircles = g_map.selectAll('.circleHighlighted,.circleHighlighted_war');
		

		var data_highlighted = selectedCircles.data().sort(sortByDateAscending);
		
		boardSVG_circle.attr('height', function(d){return selectedCircles.data().length*40.2+45});
		boardSVG.attr('height', function(d){return selectedCircles.data().length*40.2+45});
		d3.select('.timezoom').attr('height', function(d){return selectedCircles.data().length*40.2+45} )
	

		newBind_circle = boardSVG_circle.selectAll('circle').data(data_highlighted, function(d){
			return d.DispNum})
		newBind_circle.exit().transition().attr('r', 0).remove();
		newBind_circle.transition().duration(1000).attr('cy', function(d,i){ return i*40 + 25})
		newBind_circle.enter().append('circle')
		.attr('cx', 30)
		.attr('cy', function(d,i){return i*40 + 25} )
		.attr('class',function(d){return d.war == 0? 'circleDrawn' : 'circleDrawn_war'})
		.attr('r',0)
		.on('mouseover', mouseoverCircle_board)
		.on('mouseout', mouseoutCircle_board)
		.on('click', selectCircle_board)
		.transition().duration(1000)
		.attr('r',12)

		boardSVG_circle.selectAll('.circleDrawn').style('fill','#ff7b4c')
		boardSVG_circle.selectAll('.circleDrawn_war').style('stroke', '#ff7b4c');

		newBind_rect = timeRectsG.selectAll('rect').data(data_highlighted, function(d){ return d.DispNum})
		.attr('class', 't_rects')
		newBind_rect.exit().transition().attr('width', 0).remove();
		newBind_rect.transition().duration(1000).attr('y', function(d,i){
			return i*40 + 12.5})

		newBind_rect.enter().append('rect')
		.attr('x', function(d){return newScale==undefined ? timeScale(parseTime(d.Start)) : newScale(parseTime(d.Start))})
		.attr('width', 0)
		.attr('y', function(d,i){return i*40 + 12.5})
		.attr('class', 't_rects')
		.transition()
		.duration(700)
		.attr('width',
			 function(d){return newScale == undefined? d3.max([timeScale(parseTime(d.End)) - timeScale(parseTime(d.Start)),1]) : d3.max([newScale(parseTime(d.End)) - newScale(parseTime(d.Start)),1])})
		.style('fill', function(d){return fatalityScale(d.Fatality).toString()})
		.attr('height', 24)
		

		newBind_text = timeRectsG.selectAll('text')
		.data(data_highlighted, function(d){return d.DispNum})
		.attr('class', 'hostText')
		newBind_text.exit().transition().style('opacity', 0).remove();
		newBind_text.transition().duration(1000)
		.attr('y', function(d,i){return i*40 + 12.5 + 15})
		.text(function(d){return hostileStringScale(d.HostLev)})
		
		newBind_text.enter().append('text').classed('hostText',true)
		.attr('x', function(d){return newScale==undefined ? 10 + timeScale(parseTime(d.Start)) + d3.max([timeScale(parseTime(d.End)) - timeScale(parseTime(d.Start)),1])
									: 3 + newScale(parseTime(d.Start)) + d3.max([newScale(parseTime(d.End)) - newScale(parseTime(d.Start)),1])})
		.attr('y', function(d,i){return i*40 + 12.5 + 15})
		.text(function(d){return hostileStringScale(d.HostLev)})
		

		}

	else{

		selectedCircles = d3.selectAll('.intersected')
		selectedCircles_allied = d3.selectAll('.allied')
		selectedCircles_hostile = d3.selectAll('.hostile')
		 selectedCircles_merged = selectedCircles_hostile.data();

		
		for (var i = 0; i<=selectedCircles_hostile.data().length-1; i++){
			selectedCircles_hostile.data()[i].allied = false;
		}

		for (var i = 0; i<=selectedCircles_allied.data().length-1; i++){
			selectedCircles_allied.data()[i].allied = true;
			selectedCircles_merged.push(selectedCircles_allied.data()[i]);
		}


		data_intersected = selectedCircles_merged.sort(sortByDateAscending);

		boardSVG_circle.attr('height', function(d){return data_intersected.length*40.2+45});
		boardSVG.attr('height', function(d){return data_intersected.length*40.2+45});	
		d3.select('.timezoom').attr('height', function(d){return data_intersected.length*40.2+45} )

		newBind_circle = boardSVG_circle.selectAll('circle').data(data_intersected, function(d){return d.DispNum});

		newBind_circle.exit().transition().attr('r', 0).remove();
		newBind_circle.attr('class',function(d){return d.war == 0? 'circleDrawn' : 'circleDrawn_war'}).transition().duration(1000).attr('cy', function(d,i){ return i*40 + 25})
		.style('fill', function(d){
			return d.allied == false && d.war == 0? '#ff6060' 
			: 	   d.allied == false && d.war == 1? '#fff' 
			:      d.allied == true  && d.war == 0? '#5b41f4'
			:      									'#fff'} )
		.style('stroke', function(d){
			return d.allied == false && d.war == 0? '#fff' 
			: 	   d.allied == false && d.war == 1? '#ff6060' 
			:      d.allied == true  && d.war == 0? 'fff'
			:      									'#5b41f4'} );

		newBind_circle.enter().append('circle')
		.attr('cx', 30)
		.attr('cy', function(d,i){return i*40 + 25} )
		.attr('class',function(d){return d.war == 0? 'circleDrawn' : 'circleDrawn_war'})
		.attr('r',0)
		.on('mouseover', mouseoverCircle_board)
		.on('mouseout', mouseoutCircle_board)
		.on('click', selectCircle_board)
		.transition().duration(1000)
		.attr('r',12)
		.style('fill', function(d){
			return d.allied == false && d.war == 0? '#ff6060' 
			: 	   d.allied == false && d.war == 1? '#fff' 
			:      d.allied == true  && d.war == 0? '#5b41f4'
			:      									'#fff'} )
		.style('stroke', function(d){
			return d.allied == false && d.war == 0? '#fff' 
			: 	   d.allied == false && d.war == 1? '#ff6060' 
			:      d.allied == true  && d.war == 0? 'fff'
			:      									'#5b41f4'} );


		newBind_rect = timeRectsG.selectAll('rect').data(data_intersected, function (d){return d.DispNum}).attr('class', 't_rects');

		newBind_rect.exit().transition().attr('width', 0).remove();
		newBind_rect.transition().duration(1000).attr('y',function(d,i){
			return i*40 + 12.5})

		newBind_rect.enter().append('rect')
		.attr('x', function(d){return newScale==undefined ? timeScale(parseTime(d.Start)) : newScale(parseTime(d.Start))})
		.attr('width', 0)
		.attr('y', function(d,i){return i*40 + 12.5})
		.attr('class', 't_rects')
		.transition()
		.duration(700)
		.attr('width',
			 function(d){return newScale == undefined? d3.max([timeScale(parseTime(d.End)) - timeScale(parseTime(d.Start)),1]) : d3.max([newScale(parseTime(d.End)) - newScale(parseTime(d.Start)),1])})
		.style('fill', function(d){return fatalityScale(d.Fatality).toString()})
		.attr('height', 24)

		newBind_text = timeRectsG.selectAll('text')
		.data(data_intersected, function(d){return d.DispNum})
		.attr('class', 'hostText')
		newBind_text.exit().transition().style('opacity', 0).remove();

		newBind_text.transition().duration(1000)
		.attr('y', function(d,i){return i*40 + 12.5 + 15})
		.text(function(d){return hostileStringScale(d.HostLev)})
		
		newBind_text.enter().append('text').classed('hostText',true)
		.attr('x', function(d){return newScale==undefined ? 10 + timeScale(parseTime(d.Start)) + d3.max([timeScale(parseTime(d.End)) - timeScale(parseTime(d.Start)),1])
									: 3 + newScale(parseTime(d.Start)) + d3.max([newScale(parseTime(d.End)) - newScale(parseTime(d.Start)),1])})
		.attr('y', function(d,i){return i*40 + 12.5 + 15})
		.text(function(d){return hostileStringScale(d.HostLev)})

		}

	

	d3.select('.overlay').attr('width', bm_width-10).attr('height', 70);


}

function removeCircle(){
	boardSVG_circle.selectAll('circle').remove();
	boardSVG_circle.attr('height', '100%');
	boardSVG.attr('height', '100%');
	timeRectsG.selectAll('rect').remove();
}

function sortByDateAscending(a,b){
	


	if (new Date(a.Start) - new Date(b.Start) == 0){

		var x = parseInt(a.DispNum), y = parseInt(b.DispNum);
		return x-y
	}
	return new Date(a.Start) - new Date(b.Start)
}

function brushed() {
  
  brushableG.selectAll('.selection,.handle').classed('transparent', false);

  range = newScale == undefined ?  d3.brushSelection(this).map(timeScale.invert)
     		: d3.brushSelection(this).map(newScale.invert);

 
  storedValue = d3.brushSelection(this);
  infoDIV.select('#timeTeller').html( 'From '+ timeFormat(range[0])+' to '+ timeFormat(range[1])).style('opacity', 0.6);
  dragged(range[1]);

  if(circle_clicked){

		if (map_clicked == 0){

			g_map.selectAll('.map').classed('mapFiltered',false).classed('mapHighlighted',false).attr('style',null);

			g_map.selectAll('path.mapHighlighted').attr('style', null).classed('map mapNotClicked', true).classed('mapHighlighted', false);
			g_map.select('.circleClicked').transition().attr('r', dflt_radius);
			g_map.selectAll('circle.dispute').attr('style',null).attr('class',null).classed('dispute circleNotClicked', true).attr('r', dflt_radius);
			g_map.selectAll('circle.war').attr('style',null).attr('class',null).classed('war circleNotClicked opaque', true)
			circle_clicked = false;

		}

		else if (map_clicked == 1){

			g_map.selectAll('.map').classed('mapFiltered',false).classed('mapHighlighted',false).attr('style',null);

			circle_clicked = false;


		}

		else {

			g_map.selectAll('.map').classed('mapFiltered',false).classed('mapHighlighted',false).attr('style',null);

			circle_clicked = false;


		}
	
	
  }

  else { 

  	if (map_clicked == 0){

  	g_map.selectAll('.dispute,.war').filter(function(d){
  		return ( range[0] <= new Date(d.Start) && new Date(d.Start) <= range[1] ) ||
  			( range[0] <= new Date(d.End) && new Date(d.End) <= range[1] ) || ( new Date(d.Start) <= range[0] && range[1] <= new Date(d.End))
  	})
  	.style('opacity',null).classed('circleFiltered', true).classed('transparent', false).transition().attr('r', dflt_radius+1)


 	g_map.selectAll('.dispute,.war').filter(function(d){
  		return !(( range[0] <= new Date(d.Start) && new Date(d.Start) <= range[1]) ||
  			( range[0] <= new Date(d.End) && new Date(d.End) <= range[1] ) || ( new Date(d.Start) <= range[0] && range[1] <= new Date(d.End)) )
  	})
  	.classed('circleFiltered', false).classed('transparent', true).classed('opaque',false).transition().attr('r', dflt_radius)

  	var filter_all= g_map.selectAll('.circleFiltered').data().length;
  	var filter_all_war = g_map.selectAll('.war.opaque.circleFiltered').data().length;

  	

  	infoDIV.select('#info2_cont').html( '<b>' + filter_all + '</b>')
  	

   }

  else if (map_clicked == 1){

  	g_map.selectAll('.map').classed('mapFiltered',false).attr('style',null);

  	g_map.selectAll('path.map').filter(function(d){return d.properties.COWCODE == storedSelection1.COWCODE}).attr('class', 'map mapClicked');


  	d3.selectAll('.circleHighlighted,.circleHighlighted_war').filter(function(d)
  	{	return ( range[0] <= new Date(d.Start) && new Date(d.Start) <= range[1] ) ||
  			( range[0] <= new Date(d.End) && new Date(d.End) <= range[1] ) || ( new Date(d.Start) <= range[0] && range[1] <= new Date(d.End))
  		})

  .classed('circleFiltered', true).classed('transparent', false).style('pointer-events', 'all').transition().attr('r', high_radius+1)

  d3.selectAll('.circleHighlighted,.circleHighlighted_war').filter(function(d)
  	{	return !(( range[0] <= new Date(d.Start) && new Date(d.Start) <= range[1] ) ||
  			( range[0] <= new Date(d.End) && new Date(d.End) <= range[1] ) || ( new Date(d.Start) <= range[0] && range[1] <= new Date(d.End)) )
  		})

  .classed('circleFiltered', false).classed('transparent', true).classed('opaque',false).style('pointer-events', 'none').transition().attr('r', high_radius);

  	var filter_involved = g_map.selectAll('.circleFiltered').data().length;
  	var filter_involved_war = g_map.selectAll('.circleHighlighted_war.circleFiltered').data().length;

  	infoDIV.select('#info2_cont').html( '<b>' + filter_involved + '</b>')
  	
  }

  else {

	g_map.selectAll('path.map').filter(function(d){return d.properties.COWCODE == storedSelection1.COWCODE || d.properties.COWCODE == storedSelection2}).attr('class', 'map mapClicked');
	


  	d3.selectAll('.intersected').filter(function(d)
  	{	return ( range[0] <= new Date(d.Start) && new Date(d.Start) <= range[1] ) ||
  			( range[0] <= new Date(d.End) && new Date(d.End) <= range[1] ) || ( new Date(d.Start) <= range[0] && range[1] <= new Date(d.End))
  		})

  .classed('circleFiltered', true).classed('transparent', false).transition().attr('r', int_radius+1)

  d3.selectAll('.intersected').filter(function(d)
  	{	return !(( range[0] <= new Date(d.Start) && new Date(d.Start) <= range[1] ) ||
  			( range[0] <= new Date(d.End) && new Date(d.End) <= range[1] ) || ( new Date(d.Start) <= range[0] && range[1] <= new Date(d.End)) )
  		})

  .classed('circleFiltered', false).classed('transparent', true).transition().attr('r', int_radius);

  var filter_intersected = parseInt(g_map.selectAll('.circleFiltered').data().length);
  var filter_intersected_hostile = parseInt(g_map.selectAll('.circleFiltered').filter(function(){return d3.select(this).classed('hostile')}).data().length);
  var filter_intersected_allied = parseInt(g_map.selectAll('.circleFiltered').filter(function(d){return d3.select(this).classed('allied')}).data().length);
  var filter_intersected_war = parseInt(g_map.selectAll('.circleFiltered').filter(function(d){return d3.select(this).classed('war')}).data().length);

  infoDIV.select('#info2_cont').html( '<b>' + filter_intersected)

  var hbars = infoDIV.selectAll('.ProportionBars').data([ filter_intersected_hostile,filter_intersected_allied])
  	
  hbars
  	.attr('x', bm_width/2* filter_intersected_hostile/filter_intersected + bm_width/3)
	.attr('y', 0)
	.attr('width', 0)
	.style('fill',function(d,i){return i==0?'#ff6060':'#5b41f4'})

	.transition()
	.duration(800)
	.attr('x', function(d,i){return i*bm_width/2* filter_intersected_hostile/filter_intersected + bm_width/3})
	.attr('width', function(d){return d/filter_intersected * bm_width/2})
	.attr('height', 15)

infoDIV.selectAll('.countText')
		.data([filter_intersected_hostile,filter_intersected_allied])
		.classed('countText',true)
		.text(function(d){return d})
		.attr('x', function(d,i){return i==0? i*bm_width/2 + bm_width/3 - 15 : i*bm_width/2 + bm_width/3 + 4})
		.attr('y', 12)
		.style('font-size', 10.5)
		.style('opacity', 0.5);

   }

 }
  drawCharts()
}

function dragged(h){

	g_map.selectAll('.map').classed('mapFiltered',false).classed('mapHighlighted',false).attr('style',null);

	handle.attr('x1', map_timeScale(h))
	handle.attr('x2', map_timeScale(h))

	var now = h;

	d3.select('.borderDiv').select('svg').select('text').text('Border lines based on: '+ timeFormat(now));

	var new_features = initial_features.filter(function(d){return new Date(d.properties.COWSYEAR + '-' + d.properties.COWSMONTH) <= now && new Date(d.properties.COWEYEAR + '-' + d.properties.COWEMONTH) >= now })
	
	var newBind_path = g_map.selectAll('path.map').data(new_features)

	newBind_path.exit().remove();

	newBind_path.enter().insert('path', '.circleNotClicked').merge(newBind_path)
	.attr('d', path)
	.attr('vector-effect', 'non-scaling-stroke')
	.attr('class',null)
	.classed('map mapNotClicked', true)
	.on('mouseover', mouseoverMap)
	.on('mouseout', mouseoutMap)
	.on('click', selectMap)
	
}

function timeZoomed(){

  newScale = d3.event.transform.rescaleX(timeScale)
  boardAxisSVG.select('.x.axis').call(timeAxis.scale(newScale))
  range = storedValue.map(newScale.invert);
 
  timeRectsG.selectAll('rect').attr('x', function(d){return newScale(parseTime(d.Start))})
  .attr('width', function(d){return d3.max([newScale(parseTime(d.End)) - newScale(parseTime(d.Start)),1])})

  timeRectsG.selectAll('text').attr('x', function(d){return 10 + newScale(parseTime(d.Start)) + d3.max([newScale(parseTime(d.End)) - newScale(parseTime(d.Start)),1])})
}

function translateAlong(path) {
  var l = path.getTotalLength();
  return function(d, i, a) {
    return function(t) {
      var p = path.getPointAtLength(t * l);
      return "translate(" + p.x + "," + p.y + ")";
    };
  };
}


function initialize(){

    dragged(new Date('1988-12-31'));
    
	g_map.selectAll('.dispute,.war')
	.attr('r', function(){return d3.select(this).classed('war')? war_radius : dflt_radius})
	.attr('class',function(){return d3.select(this).classed('war')? 'war circleNotClicked opaque' : 'dispute circleNotClicked'})

	boardSVG_circle.attr('height', function(d){return data.length*40.2+7});
	boardSVG.attr('height', function(d){return data.length*40.2+7});	

	d3.select('.timezoom').attr('height', function(d){return data.length*40.2+7} )


	allCircles = boardSVG_circle.selectAll('circle').data(data.sort(sortByDateAscending), function(d){return d.DispNum})

	allCircles.attr('style',null).attr('class', function(d){return d.war==0?'circleDrawn':'circleDrawn_war'})
	.transition().duration(1000)
	.attr('cy', function(d,i){return i*40 + 25} )
	.style('stroke',function(d){return d3.select(this).classed('circleDrawn')? '#fff' : '#014e66'  });


	allCircles.enter().append('circle')
		.attr('class', function(d){return d.war==0?'circleDrawn':'circleDrawn_war'})
		.attr('cx', 30)
		.attr('cy', function(d,i){return i*40 + 25} )
		.attr('r',0)
		.style('stroke',function(d){return d3.select(this).classed('circleDrawn')? '#fff' : '#014e66'  })
		.on('mouseover', mouseoverCircle_board)
		.on('mouseout', mouseoutCircle_board)
		.on('click', selectCircle_board)
	    .transition()
		.duration(1000)
		.attr('r', 12);

	allRects = timeRectsG.selectAll('rect').data(data.sort(sortByDateAscending), function(d){return d.DispNum}).attr('class', 't_rects');

	allRects.transition().duration(1000).attr('y',function(d,i){return i*40+12.5});

	allRects.enter().append('rect').attr('x', function(d){return newScale==undefined ? timeScale(parseTime(d.Start)) : newScale(parseTime(d.Start))})
	.attr('width', 0)
	.attr('y', function(d,i){return i*40 + 12.5})
	.attr('class', 't_rects')
	.transition()
	.duration(700)
	.attr('width',
		 function(d){return newScale == undefined? d3.max([timeScale(parseTime(d.End)) - timeScale(parseTime(d.Start)),1]) : d3.max([newScale(parseTime(d.End)) - newScale(parseTime(d.Start)),1])})
	.style('fill', function(d){return fatalityScale(d.Fatality).toString()})
	.attr('height', 24)

	allText = timeRectsG.selectAll('text').data(data.sort(sortByDateAscending), function(d){return d.DispNum}).attr('class','hostText')

	allText.transition().duration(1000)
	.attr('y', function(d,i){return i*40 + 12.5 + 15})

	allText.enter().append('text').classed('hostText',true)
	.attr('x', function(d){return newScale==undefined ? 10 + timeScale(parseTime(d.Start)) + d3.max([timeScale(parseTime(d.End)) - timeScale(parseTime(d.Start)),1])
								: 10 + newScale(parseTime(d.Start)) + d3.max([newScale(parseTime(d.End)) - newScale(parseTime(d.Start)),1])})
	.attr('y', function(d,i){return i*40 + 12.5 + 15})
	.text(function(d){return hostileStringScale(d.HostLev)})

	g_map.selectAll('.mapFiltered').attr('style',null).attr('filter',null).classed('mapFiltered',false).classed('mapNotClicked', true);

	infoDIV.selectAll('div').html('');
	infoDIV.select('#info2').style('height','20px');
	infoDIV.select('#info2_cont').style('height','20px');
	infoDIV.select('#info2').style('margin-top','0px');
	infoDIV.select('#info2').style('width',null)
	infoDIV.select('#info2_cont').style('width',null)
	infoDIV.select('#info3').style('width',null)
	infoDIV.select('#info3_cont').style('width',null)
	infoDIV.select('#info3').style('display','none');
	infoDIV.select('#info3_cont').style('display','none');
	infoDIV.select('#info4').style('margin-top',function(){return window.innerWidth >=1080? '15px' : '0px'});
	
	boardSVG_circle.selectAll('text').remove();

	legends.selectAll('.legend_dispute,.legend_war').remove();
	legends_2.selectAll('.legendRects').remove();
	legends.select('.definition').remove();

	legends.append('circle').attr('r', 7).attr('cx', 20).attr('cy', 20).classed('legend_dispute dispute', true);
	legends.append('text').classed('legend_dispute', true).text('Interstate Dispute').attr('x',35).attr('y',24);
	legends.append('circle').attr('r', 6).attr('cx', 160).attr('cy', 20).classed('legend_war war', true)
	
	legends.append('text').classed('legend_war',true).text('Interstate War').attr('x',175).attr('y',24);

	legends.append('text').classed('definition', true).text('Typology?').attr('x', 270).attr('y', 24).style('opacity', 0.4).style('font-size', 11.5)
	.on('mouseover', typologyTip.show)
	.on('mouseout', typologyTip.hide)

	g_map.selectAll('circle').transition().attr('r',dflt_radius);


	infoDIV.select('#info1').html('No selection');
	infoDIV.select('#info2').html('Total count of MID/War : ')
	infoDIV.select('#info2_cont').html('<b>'+g_map.selectAll('.dispute.circleNotClicked,.war.circleNotClicked').data().length)
	
	var chartSVG = infoDIV.select('#info4').append('svg').attr('id', 'chartSVG')
	.attr('width', '100%').attr('height', 230)
	drawCharts();
}

function drawLegends(d){

	if (map_clicked == 0){

		legends.selectAll('.legend_dispute,.legend_war').remove();
		legends_2.selectAll('.legendRects').remove();
		legends.select('.definition').remove();


	legends.append('circle').attr('r', 7).attr('cx', 20).attr('cy', 20).classed('legend_dispute dispute', true);
	legends.append('text').classed('legend_dispute', true).text('Interstate Dispute').attr('x',35).attr('y',24);
	legends.append('circle').attr('r', 6).attr('cx', 160).attr('cy', 20).classed('legend_war war', true)
	
	legends.append('text').classed('legend_war',true).text('Interstate War').attr('x',175).attr('y',24);

	legends.append('text').classed('definition', true).text('Typology?').attr('x', 270).attr('y', 24).style('opacity', 0.4).style('font-size', 11.5)
	.on('mouseover', typologyTip.show)
	.on('mouseout', typologyTip.hide)



	}

	else if(map_clicked == 1){

		legends.select('.definition').remove()
		legends.selectAll('.legend_dispute,.legend_war').remove();
		legends_2.selectAll('.legendRects').remove();

		var legendLength = 20;

		if (document.querySelector('.circleHighlighted') !== null) {


			var d_high = legends.append('circle').attr('r', 7).attr('cx', legendLength).attr('cy', 20).classed('legend_dispute dispute legend_high', true);
			var d_high_text = legends.append('text').classed('legend_dispute legend_high', true).text('Dispute where '+d.properties.CNTRY_NAME+' got Involved').attr('x',legendLength + 15).attr('y',24);

			legendLength = legendLength + d_high_text.property('textContent').length*7 + 25

		
		}
		

		if(document.querySelector('.circleHighlighted_war') !== null){



			var w_high = legends.append('circle').attr('r', 7).attr('cx', legendLength).attr('cy', 20).classed('legend_war war legend_high_war', true);
			var w_high_text = legends.append('text').classed('legend_war legend_high_war', true).text('War where '+d.properties.CNTRY_NAME+' got Involved').attr('x',legendLength + 15).attr('y',24);

			legendLength = legendLength + w_high_text.property('textContent').length*7 + 25
		}
	

		var countTip = d3.tip()
  		.attr('class', 'd3-tip')
  		.offset([-10, 0])
  		.html(function(d) {
    	return '<strong><span style="color:white">' + d.text + "</span>" });

    	legends_2.call(countTip)

		legends_2.selectAll('rect').data([{lev:1, text: '1-3'},{lev:2, text: '4-8'},{lev:3, text: '11-14'},{lev:4, text: '15-20'},{lev:5, text: '21-25'},{lev:6, text: '26-31'},{lev:7, text: '32-37'},{lev:8, text: '36-42'},{lev:9, text: '43-48'},{lev:10, text: '49 or more'}]).
		enter().append('rect').classed('legendRects', true)
		.attr('x', function(d,i){return window.innerWidth>=1080?i*25 + 15: i*20 + 15})
		.attr('y', 35)
		.attr('width', function(d){return window.innerWidth>=1080?25:20})
		.attr('height', function(d){return window.innerWidth>=1080?20:15})
		.style('fill', function(d){return freqColorScale(d.lev)})
		.on('mouseover',countTip.show)
		.on('mouseout', countTip.hide)
		

		legends_2.append('text').text('Total count of dispute and war against '+d.properties.CNTRY_NAME).classed('legendRects',true).attr('x',15).attr('y', 27).style('font-size', function(){return window.innerWidth>=1080? 11.5:10});

	}

	else{

		legends.selectAll('.legend_dispute,.legend_war').remove();
		legends_2.selectAll('.legendRects').remove();

							
		var legendLength = 20;

		if (document.querySelector('.dispute.intersected.hostile') !== null) {

			var d_hostile = legends.append('circle').attr('r', 7).attr('cx', legendLength).attr('cy', 20).classed('legend_dispute dispute legend_hostile', true);
			var d_hostile_text = legends.append('text').classed('legend_dispute legend_hostile', true).text('Dispute where '+d.properties.CNTRY_NAME+' and '+storedSelection1.CNTRY_NAME+' were hostile').attr('x',legendLength + 15).attr('y',24);
		
			
			legendLength = legendLength + d_hostile_text.property('textContent').length*7 + 10
		}

		if (document.querySelector('.dispute.intersected.allied') !== null){

			var d_allied = legends.append('circle').attr('r', 7).attr('cx', legendLength).attr('cy', 20).classed('legend_dispute dispute legend_allied', true);
			var d_allied_text = legends.append('text').classed('legend_dispute legend_allied', true).text('Dispute where '+d.properties.CNTRY_NAME+' and '+storedSelection1.CNTRY_NAME+' were allied').attr('x',legendLength + 15).attr('y',24);

			legendLength = legendLength + d_allied_text.property('textContent').length*7 + 10

		}

		if (document.querySelector('.war.intersected.hostile') !== null) {

			var w_hostile = legends.append('circle').attr('r', 7).attr('cx', legendLength).attr('cy', 20).classed('legend_war war legend_hostile_war', true);
			var w_hostile_text = legends.append('text').classed('legend_war legend_hostile_war', true).text('War where '+d.properties.CNTRY_NAME+' and '+storedSelection1.CNTRY_NAME+' were hostile').attr('x',legendLength + 15).attr('y',24);

			legendLength = legendLength + w_hostile_text.property('textContent').length*7 + 10

		}

		if (document.querySelector('.war.intersected.allied') !== null) {

			var w_allied = legends.append('circle').attr('r', 7).attr('cx', legendLength).attr('cy', 20).classed('legend_war war legend_allied_war', true);
			var w_allied_text = legends.append('text').classed('legend_war legend_allied_war', true).text('War where '+d.properties.CNTRY_NAME+' and '+storedSelection1.CNTRY_NAME+' were allied').attr('x',legendLength + 15).attr('y',24);

			legendLength = legendLength + w_hostile_text.property('textContent').length*7 + 10

		}


	}

 	
}

function describe(selection){


	if( selection.classed('map') &&	map_clicked == 1){

		
		var warList = []

		for (var i = 0 ; i <= fltr_circles_war.data().length-1; i++){

			warList.push(fltr_circles_war.data()[i].war_name)
		}

		infoDIV.select('#info1').html(selection.data()[0].properties.CNTRY_NAME)
		infoDIV.select('#info2').html('Total count of MID/War involved:'   )
		infoDIV.select('#info2_cont').html( '<b>' + fltr_circles.data().length + '</b>')

	}

	else if( selection.classed('map') && map_clicked == 2){

		infoDIV.select('#info2').style('width', function(){return window.innerWidth>=1080? '80%': '92%'})
		infoDIV.select('#info2_cont').style('width',  function(){return window.innerWidth>=1080? '20%': '5%'})
		infoDIV.select('#info3').style('display','block');
		infoDIV.select('#info3_cont').style('display','block');

		var warList_int = []

		for ( var i = 0; i <= fltr_circles_int_war.data().length-1; i++){

			warList_int.push(fltr_circles_war.data()[i].war_name)

		}


		infoDIV.select('#info1').html(storedSelection1.CNTRY_NAME +' : ' +selection.data()[0].properties.CNTRY_NAME)
		
		infoDIV.select('#info2')
		.html('Total count of MID/War both countries involved:')
			
		infoDIV.select('#info2_cont').html( '<b>' + fltr_circles_int.data().length +'</b>' )
		
		var hbarSVG = infoDIV.select('#info3').append('svg').attr('class', 'hbarSVG');
		var hbar = hbarSVG.selectAll('.ProportionBars')
		.data([fltr_circles_int_hostile.data().length,fltr_circles_int_allied.data().length])
		
		hbar.enter().append('rect').merge(hbar)
		.classed('ProportionBars', true)

		.attr('x', bm_width/2* fltr_circles_int_hostile.data().length/fltr_circles_int.data().length + bm_width/3)
		.attr('y', 0)
		.style('fill',function(d,i){return i==0?'#ff6060':'#5b41f4'})
		.transition()
		.duration(800)
		.attr('x', function(d,i){return i*bm_width/2* fltr_circles_int_hostile.data().length/fltr_circles_int.data().length + bm_width/3})
		.attr('width', function(d){return d/fltr_circles_int.data().length * bm_width/2})
		.attr('height', 15)
		


		infoDIV.select('#info3_cont').style('height','20px')


		hbarSVG.selectAll('.countText')
		.data([fltr_circles_int_hostile.data().length,fltr_circles_int_allied.data().length])
		.enter().append('text').classed('countText',true)
		.text(function(d){return d})
		.attr('x', function(d,i){return i==0? i*bm_width/2 + bm_width/3 - 15 : i*bm_width/2 + bm_width/3 + 4})
		.attr('y', 12)
		.style('font-size', 10.5)
		

		hbarSVG.selectAll('._countText')
		.data(['Hostile', 'Allied'])
		.enter().append('text').classed('_countText', true)
		.text(function(d){return d})
		.attr('x', function(d,i){return i==0? i*bm_width/2 + bm_width/3 - 60 : i*bm_width/2 + bm_width/3 + 30})
		.attr('y', 12)
		.style('font-size', 10.5)
		
		infoDIV.select('#info4').select('ul').remove();
		infoDIV.select('#info4')

	}

	else if(selection.classed('dispute')||selection.classed('war')||selection.classed('circleDrawn')||selection.classed('circleDrawn_war')){

	infoDIV.select('#info1').style('width','90%');
	infoDIV.select('#timeTeller').style('width','10%');
	infoDIV.select('#info2').style('height','20px').style('margin-top','0px');
	infoDIV.select('#info2_cont').style('height','20px').style('margin-top','0px');
	infoDIV.select('#info5').select('svg').remove();
	infoDIV.select('#info2_cont').html('');
	infoDIV.select('#info3_cont').html('');
	infoDIV.select('#info3').style('display','block');
	infoDIV.select('#info3_cont').style('display','block');
	infoDIV.select('#info3').style('margin-top', '0px');
	infoDIV.select('#info3_cont').style('margin-top', '0px');
	

	infoDIV.select('#info4').style('margin-left', "0px").style('margin-top', '15px');

	infoDIV.select('#info1').html('Dispute #'+selection.data()[0].DispNum);

	infoDIV.select('#info2')
	.html('<b>Time:</b> ' + timeFormat(parseTime(selection.data()[0].Start))
	 + ' - ' + timeFormat(parseTime(selection.data()[0].End)))
	
	infoDIV.select('#info3')
	.html('<b>Fatality:</b> '+ fatalityStringScale(selection.data()[0].Fatality) + '</br><b>Hostility:</b> ' + hostilityStringScale(selection.data()[0].HostLev))
	
	infoDIV.select('#info4').html('<b>Involved countries:')
	
	var temp = infoDIV.select('#info5').append('svg');

		temp.append('rect').attr('fill','#0cafcc').attr('x', 10).attr('y', 6).attr('width',12).attr('height', 12);
		temp.append('text').attr('x', 28).attr('y',15).text('Initiator\'s side: ').style('font-size', 12)
		temp.append('text').attr('x', 120).attr('y',15)
 			.text(
			function(){    
						  var a_list = [];
						  for (var i = 0; i <= selection.data()[0].countries_A.length - 1; i++){

						  	a_list.push(
							  	 g_map.selectAll('.map')
								 .filter(function(d_){
								 	return include(selection.data()[0].countries_A, d_.properties.COWCODE)})
								 .data()[i].properties.CNTRY_NAME	
							 )

						  }

						  return a_list.join(', ');
						 
				   	}
			
			)
			.classed('a_list',true).style('font-size', 12)

		temp.append('rect').attr('fill','#f7c062').attr('x', 10).attr('y', 27).attr('width',12).attr('height', 12);
		temp.append('text').attr('x', 28).attr('y',37).text('Target\'s side: ').style('font-size', 12)
		temp.append('text').attr('x', 120).attr('y',37)
 			.text(
			function(){    
						  var b_list = [];
						  for (var i = 0; i <= selection.data()[0].countries_B.length - 1; i++){

						  	b_list.push(
							  	 g_map.selectAll('.map')
								 .filter(function(d_){
								 	return include(selection.data()[0].countries_B, d_.properties.COWCODE)})
								 .data()[i].properties.CNTRY_NAME	
							 )

						  }

						  return b_list.join(', ');
						 
				   	}
			
			)
			.classed('b_list',true).style('font-size', 12)

		infoDIV.select('#info5').style('height', function(){return window.innerWidth>=1080?'75px':'60px'})

		temp.attr('width', d3.max([infoDIV.select('.a_list').property('textContent').length*6+150, infoDIV.select('.b_list').property('textContent').length*6+150]) + 'px')


		if(selection.classed('war')||selection.classed('circleDrawn_war')){

			infoDIV.select('#info1').html(selection.data()[0].war_name)
		}
	}

	drawCharts();

}

function resize(){

	bm_width =  d3.select('#boardMain').style('width').replace('px','');
	bm_height = d3.select('#boardMain').style('height').replace('px','');

	timeScale = d3.scaleTime()
   .domain([new Date('1946-03'), new Date('1991-12-31')])
   .range([0, bm_width-10]);

   	timeAxis = d3.axisTop(timeScale)
				 .tickFormat(timeFormat)
			     .tickSize(5)
			     .tickPadding(10)
    
    window.innerWidth >= 1080?
    timeAxis.ticks(4)
    :timeAxis.ticks(3);

	axisG.call(timeAxis);

	brush.extent([[0,15],[bm_width-10,bm_height]]);
	brushableG.call(brush);
	brushableG.select('.overlay').attr('width', bm_width-10).attr('height', 70);
	
	brushableG.select('.selection')
	.style('height', d3.select('.timeWrapper').property('clientHeight')+10);
	brushableG.select('.handle')
	.style('height', d3.select('.timeWrapper').property('clientHeight')+10);
}

function filterByFatality(d){

	g_map.selectAll('circle').filter(function(d_){
		return parseInt(d_.Fatality) !== d && !d3.select(this).classed('transparent')})
	.classed('transparent2', true).classed('circleFiltered', false).classed('opaque', false);

	var temp = g_map.selectAll('circle').filter(function(d_){
		return parseInt(d_.Fatality) == d && !d3.select(this).classed('transparent')});
	temp.classed('transparent2', false).classed('circleFiltered', true).classed('opaque',true);

	var fatalityFiltered = boardSVG_circle.selectAll('circle')
	.data(temp.data().sort(sortByDateAscending), function(d){return d.DispNum})

	boardSVG_circle.attr('height', function(d){return temp.data().length*40.2+45});
	boardSVG.attr('height', function(d){return temp.data().length*40.2+45});

	fatalityFiltered.exit().transition().attr('r', 0).remove();
	fatalityFiltered.enter().append('circle').merge(fatalityFiltered)
	.attr('class',function(d){return d.war == 0? 'circleDrawn' : 'circleDrawn_war'})
	.attr('cy', function(d,i){return i*40 + 25} )
	.attr('r',0)
	.on('mouseover', mouseoverCircle_board)
	.on('mouseout', mouseoutCircle_board)
	.on('click', selectCircle_board)
	.transition().duration(1000)
	.attr('r', 12).attr('cx', 30)
	.style('fill', function(d){return map_clicked==0 && d.war==0? '#014e66'
					  :map_clicked==0 && d.war==1? '#fff'
					  :map_clicked==1 && d.war==0? '#ff7b4c'
					  :map_clicked==1 && d.war==1? '#fff'
					  :map_clicked==2 && d.war==0 && d.allied==true? '#5b41f4'
					  :map_clicked==2 && d.war==0 && d.allied==false? '#ff6060'
					  :map_clicked==2 && d.war==1 && d.allied==true? '#fff'
					  :'#fff'
				 })
	.style('stroke', function(d){return map_clicked==0 && d.war==0? '#fff'
					  :map_clicked==0 && d.war==1? '#014e66'
					  :map_clicked==1 && d.war==0? '#fff'
					  :map_clicked==1 && d.war==1? '#ff7b4c'
					  :map_clicked==2 && d.war==0 && d.allied==true? '#fff'
					  :map_clicked==2 && d.war==0 && d.allied==false? '#fff'
					  :map_clicked==2 && d.war==1 && d.allied==true? '#5b41f4'
					  :'#ff6060'})
	

	var fatalityFiltered_rect = timeRectsG.selectAll('rect')
	.data(temp.data().sort(sortByDateAscending), function(d){return d.DispNum})

	fatalityFiltered_rect.exit().transition().attr('width',0).remove();
	fatalityFiltered_rect.enter().append('rect').merge(fatalityFiltered_rect)
	.attr('x', function(d){return newScale==undefined ? timeScale(parseTime(d.Start)) : newScale(parseTime(d.Start))})
	.attr('width', 0)
	.attr('y', function(d,i){return i*40 + 12.5})
	.attr('class', 't_rects')
	.transition()
	.duration(700)
	.attr('width',
		 function(d){return newScale == undefined? d3.max([timeScale(parseTime(d.End)) - timeScale(parseTime(d.Start)),1]) : d3.max([newScale(parseTime(d.End)) - newScale(parseTime(d.Start)),1])})
	.style('fill', function(d){return fatalityScale(d.Fatality).toString()})
	.attr('height', 24)

	var fatalityFiltered_text = timeRectsG.selectAll('text')
	.data(temp.data().sort(sortByDateAscending), function(d){return d.DispNum})
	fatalityFiltered_text.exit().transition().style('opacity',0).remove();
	fatalityFiltered_text.enter().append('text').merge(fatalityFiltered_text)
	.classed('hostText',true)
		.attr('x', function(d){return newScale==undefined ? 10 + timeScale(parseTime(d.Start)) + d3.max([timeScale(parseTime(d.End)) - timeScale(parseTime(d.Start)),1])
									: 3 + newScale(parseTime(d.Start)) + d3.max([newScale(parseTime(d.End)) - newScale(parseTime(d.Start)),1])})
		.attr('y', function(d,i){return i*40 + 12.5 + 15})
		.text(function(d){return hostileStringScale(d.HostLev)})


}

function filterByHostility(d){

	g_map.selectAll('circle').filter(function(d_){
		return parseInt(d_.HostLev) !== d && !d3.select(this).classed('transparent')})
	.classed('transparent2', true).classed('circleFiltered', false).classed('opaque', false);

	var temp = g_map.selectAll('circle').filter(function(d_){
		return parseInt(d_.HostLev) == d && !d3.select(this).classed('transparent')});
	temp.classed('transparent2', false).classed('circleFiltered', true).classed('opaque',true);

	
	var hostilityFiltered = boardSVG_circle.selectAll('circle')
	.data(temp.data().sort(sortByDateAscending), function(d){return d.DispNum})

	boardSVG_circle.attr('height', function(d){return temp.data().length*40.2+45});
	boardSVG.attr('height', function(d){return temp.data().length*40.2+45});

	hostilityFiltered.exit().transition().attr('r', 0).remove();
	hostilityFiltered.enter().append('circle').merge(hostilityFiltered)
	.attr('class',function(d){return d.war == 0? 'circleDrawn' : 'circleDrawn_war'})
	.attr('cy', function(d,i){return i*40 + 25} )
	.attr('r',0)
	.on('mouseover', mouseoverCircle_board)
	.on('mouseout', mouseoutCircle_board)
	.on('click', selectCircle_board)
	.transition().duration(1000)
	.attr('r', 12).attr('cx', 30)
	.style('fill', function(d){return map_clicked==0 && d.war==0? '#014e66'
					  :map_clicked==0 && d.war==1? '#fff'
					  :map_clicked==1 && d.war==0? '#ff7b4c'
					  :map_clicked==1 && d.war==1? '#fff'
					  :map_clicked==2 && d.war==0 && d.allied==true? '#5b41f4'
					  :map_clicked==2 && d.war==0 && d.allied==false? '#ff6060'
					  :map_clicked==2 && d.war==1 && d.allied==true? '#fff'
					  :'#fff'
				 })
	.style('stroke', function(d){return map_clicked==0 && d.war==0? '#fff'
					  :map_clicked==0 && d.war==1? '#014e66'
					  :map_clicked==1 && d.war==0? '#fff'
					  :map_clicked==1 && d.war==1? '#ff7b4c'
					  :map_clicked==2 && d.war==0 && d.allied==true? '#fff'
					  :map_clicked==2 && d.war==0 && d.allied==false? '#fff'
					  :map_clicked==2 && d.war==1 && d.allied==true? '#5b41f4'
					  :'#ff6060'})
	

	var hostilityFiltered_rect = timeRectsG.selectAll('rect')
	.data(temp.data().sort(sortByDateAscending), function(d){return d.DispNum})

	hostilityFiltered_rect.exit().transition().attr('width',0).remove();
	hostilityFiltered_rect.enter().append('rect').merge(hostilityFiltered_rect)
	.attr('x', function(d){return newScale==undefined ? timeScale(parseTime(d.Start)) : newScale(parseTime(d.Start))})
	.attr('width', 0)
	.attr('y', function(d,i){return i*40 + 12.5})
	.attr('class', 't_rects')
	.transition()
	.duration(700)
	.attr('width',
		 function(d){return newScale == undefined? d3.max([timeScale(parseTime(d.End)) - timeScale(parseTime(d.Start)),1]) : d3.max([newScale(parseTime(d.End)) - newScale(parseTime(d.Start)),1])})
	.style('fill', function(d){return fatalityScale(d.Fatality).toString()})
	.attr('height', 24)

	var hostilityFiltered_text = timeRectsG.selectAll('text')
	.data(temp.data().sort(sortByDateAscending), function(d){return d.DispNum})
	hostilityFiltered_text.exit().transition().style('opacity',0).remove();
	hostilityFiltered_text.enter().append('text').merge(hostilityFiltered_text)
	.classed('hostText',true)
		.attr('x', function(d){return newScale==undefined ? 10 + timeScale(parseTime(d.Start)) + d3.max([timeScale(parseTime(d.End)) - timeScale(parseTime(d.Start)),1])
									: 3 + newScale(parseTime(d.Start)) + d3.max([newScale(parseTime(d.End)) - newScale(parseTime(d.Start)),1])})
		.attr('y', function(d,i){return i*40 + 12.5 + 15})
		.text(function(d){return hostileStringScale(d.HostLev)})


}

function drawCharts(){

//FatalityChart
	var chartWidth = window.innerWidth >= 1080? 300 : 255;
	var chartHeight =  window.innerWidth >= 1080?150 : 120;

	 infoDIV.select('#chartSVG').selectAll('.graphTitle').remove();
	 infoDIV.select('#chartSVG').select('.hostilityBaseG').remove()
	 

	var x = d3.scaleBand().rangeRound([0, chartWidth/2 ]).padding(0.07),
    	y = d3.scaleLinear().rangeRound([0, chartHeight]);

     
	var fatalityData = []

	for(var i = 0; i <= 6; i++){

		fatalityData[i] = g_map.selectAll('circle').filter(function(d){return d.Fatality == i && !d3.select(this).classed('transparent')}).data().length 

	}

	fatalityData.unshift(g_map.selectAll('circle').filter(function(d){return d.Fatality == -9 && !d3.select(this).classed('transparent')}).data().length)

	 x.domain(fatalityStringScale.domain());
  	 y.domain([0, d3.max(fatalityData, function(d) { return d })]);


  	infoDIV.select('#chartSVG').append('text').classed('graphTitle', true).
  	text('Fatality Distribution').style('font-size', 10.5)
  	.attr('y', 10)
  	.attr('x', function(d,i) { return x(fatalityStringScale.domain()[i]); })

	var bars = infoDIV.select('#chartSVG').selectAll('.fatalityBars').data(fatalityData);

	bars.enter().append('rect').merge(bars).classed('fatalityBars',true)
	.attr('x', function(d,i) { return x(fatalityStringScale.domain()[i]); })
    .attr('y', function(d) {  return chartHeight + 50 ; })
    .attr('width', x.bandwidth())
    .attr('height', 0)
    .transition().duration(800)

    .attr('y', function(d) { return chartHeight - y(d) + 50; })
    .attr('height', function(d) { return y(d) < 0? 0: y(d); })

    var bars_num_f = infoDIV.select('#chartSVG').selectAll('.bars_num_f').data(fatalityData);
    bars_num_f.exit().remove();
    bars_num_f.enter().append('text').merge(bars_num_f)
    .attr('class', 'bars_num_f')
    .attr('x', function(d,i) { return x(fatalityStringScale.domain()[i]) + x.bandwidth()/2 })
    .attr('y', function(d){return chartHeight - y(d) + 43})
    .text(function(d){return d})
   


    infoDIV.select('#chartSVG')
	    	.selectAll('.fatalityBase')
			.data([-9,0,1,2,3,4,5,6])
			.enter().append('rect')
			.classed('fatalityBase', true)
			.attr('x', function(d,i) { return x(fatalityStringScale.domain()[i])})
			.attr('y', chartHeight + 53)
			.attr('width', x.bandwidth())
			.attr('height', 12)
			.style('fill', function(d){return fatalityScale(d)})
			.style('cursor','pointer')
			.on('mouseover', fatalityTip.show)
			.on('mouseout', fatalityTip.hide)
			.on('click', filterByFatality);


 //Hostility Chart
	var x2 = d3.scaleBand().rangeRound([chartWidth/2+20, chartWidth]).padding(0.07),
    	y2 = d3.scaleLinear().rangeRound([0,chartHeight]);

     
	var hostilityData = []

	for(var i = 0; i <= 3; i++){

		hostilityData[i] = g_map.selectAll('circle').filter(function(d){return d.HostLev == i+2 && !d3.select(this).classed('transparent')}).data().length 

	}

	 x2.domain([2,3,4,5]);
  	 y2.domain([0, d3.max(hostilityData, function(d) { return d })]);

	infoDIV.select('#chartSVG').append('text').classed('graphTitle', true).
  	text('Hostility Distribution').style('font-size', 10.5)
  	.attr('y', 10)
  	.attr('x', function(d,i) { return x2(x2.domain()[i]); })
	 
	var bars = infoDIV.select('#chartSVG').selectAll('.hostilityBars').data(hostilityData);

	bars.enter().append('rect').merge(bars).classed('hostilityBars',true)
	.attr('x', function(d,i) { return x2(x2.domain()[i]); })
   
    .attr('width', x2.bandwidth())
    .attr('y', function(d) { return chartHeight + 50; })
    .attr('height',0)
   	
    .transition().duration(800)

    .attr('y', function(d) { return chartHeight - y2(d) +50; })
    .attr('height', function(d) { return y2(d) < 0? 0: y2(d); })

    var bars_num_h = infoDIV.select('#chartSVG').selectAll('.bars_num_h').data(hostilityData);
        bars_num_h.exit().remove();
    bars_num_h.enter().append('text').merge(bars_num_h)
    .attr('class', 'bars_num_h')
    .attr('x', function(d,i) { return x2(x2.domain()[i]) + x2.bandwidth()/2 })
    .attr('y', function(d){return chartHeight - y2(d) + 43})
    .text(function(d){return d})
   

    infoDIV.select('#chartSVG').append('g').classed('hostilityBaseG', true)
	    	.selectAll('rect').data([2,3,4,5])
			.enter().append('rect')
			.classed('hostilityBase', true)
			.attr('x', function(d,i){return x2(x2.domain()[i])})
			.attr('y', chartHeight + 53)
			.attr('height', 12)
			.attr('width',x2.bandwidth())
			.style('fill', '#fff')
			.style('opacity', 0.5)
			.style('cursor','pointer')
			.style('stroke-width', 1)
			.style('stroke', 'black')
			.on('click', filterByHostility)
			.on('mouseover', hostilityTip.show)
			.on('mouseout', hostilityTip.hide)

    infoDIV.select('#chartSVG').select('.hostilityBaseG').selectAll('text').data(['T','D','U','W'])
    		.enter().append('text').classed('hostilityBaseG_text',true)
    		.text(function(d){return d})
			.attr('x', function(d,i){return x2(x2.domain()[i]) + x2.bandwidth()/2})
			.attr('y', chartHeight + 62)
			

}

function countrySearch(){

	var country = d3.select('li.selected').select(".eac-item").property('innerText');
	var searchedMap= g_map.selectAll('path.map').filter(function(d){return d.properties.CNTRY_NAME == country.toString()})
	
	fltr_circles = g_map.selectAll('.dispute,.war').filter(function (d_){
		return include(d_.countries_A, searchedMap.data()[0].properties.COWCODE) ||
	  	   include(d_.countries_B, searchedMap.data()[0].properties.COWCODE)});

 	fltr_circles_war = g_map.selectAll('.war').filter(function (d_){
		return include(d_.countries_A, searchedMap.data()[0].properties.COWCODE) ||
	  	   include(d_.countries_B, searchedMap.data()[0].properties.COWCODE)});

	infoDIV.select('#timeTeller').html('');
	brushableG.selectAll('.selection,.handle').classed('transparent', true);


	var allCircles, allRects;
	
			if (circle_clicked ){
				
				g_map.selectAll('path.map').attr('style', null).classed('mapNotClicked', true).
				classed('mapClicked', false).classed('mapHighlighted', false);

				g_map.select('.circleClicked').transition().attr('r', dflt_radius)

				
				boardSVG_circle.select('.circleClicked').transition().attr('r', 12);
				initialize();
				map_clicked = 0;
				circle_clicked = false;

			}
				
			else { 

				if (map_clicked == 0){

					
				 	storedSelection1 = searchedMap.data()[0].properties
				 	
					g_map.selectAll('.dispute.circleNotClicked,.war.circleNotClicked').classed('transparent',true).classed('opaque', false).classed('circleFiltered',false).attr('r', dflt_radius);

					searchedMap.attr('style', null).attr('class', null).classed('map mapClicked', true);
				
					fltr_circles.attr('style',null)
					.attr('class', function(){return d3.select(this).classed('war')? 'war circleHighlighted_war' : 'dispute circleHighlighted'})
					.classed('opaque', true).classed('transparent',false)
					.transition().attr('r',3.5);
					

					var fltr_pool_hostile = [];
					var fltr_pool_allied = [];

					for (var i = 0; i <= fltr_circles.data().length-1; i++){


						for (var j = 0; j <= fltr_circles.data()[i].countries_A.length-1; j++){

							if(include(fltr_circles.data()[i].countries_A, searchedMap.data()[0].properties.COWCODE) && fltr_circles.data()[i].countries_A[j] !== searchedMap.data()[0].properties.COWCODE.toString()){
								
								fltr_pool_allied.push(fltr_circles.data()[i].countries_A[j])
						
							}

							if(!include(fltr_circles.data()[i].countries_A, searchedMap.data()[0].properties.COWCODE)){

								fltr_pool_hostile.push(fltr_circles.data()[i].countries_A[j])
							}


						}

						for (var j = 0; j <= fltr_circles.data()[i].countries_B.length-1; j++){

							if(include(fltr_circles.data()[i].countries_B, searchedMap.data()[0].properties.COWCODE) && fltr_circles.data()[i].countries_B[j] !== searchedMap.data()[0].properties.COWCODE.toString()){
								
								fltr_pool_allied.push(fltr_circles.data()[i].countries_B[j])
						
							}

							if(!include(fltr_circles.data()[i].countries_B, searchedMap.data()[0].properties.COWCODE)){

								fltr_pool_hostile.push(fltr_circles.data()[i].countries_B[j])
							}	

						}


					}

					var counts_hostile = {}

					fltr_pool_hostile.forEach(function(x) { 
											counts_hostile[x] = (counts_hostile[x] || 0)+1; });

					
					var filtered_map = g_map.selectAll('path.map').filter(function(d){return counts_hostile.hasOwnProperty(d.properties.COWCODE) }).classed('mapFiltered',true);

					filtered_map.style('fill', function(d){return freqColorScale(frequencyScale(counts_hostile[d.properties.COWCODE]))})
								.style('stroke', function(d){return freqStrokeScale(frequencyScale(counts_hostile[d.properties.COWCODE]))})
								.attr('vector-effect', 'non-scaling-stroke')
					
					map_clicked = 1
					
					describe(searchedMap);
					drawCircle();
					drawLegends(searchedMap.data()[0]);
						
				}

				else{

					if(map_clicked == 1){

						if(!searchedMap.classed('mapClicked'))
						{
							storedSelection2 = searchedMap.data()[0].properties.COWCODE
							g_map.selectAll('.mapFiltered').style('fill',null).style('stroke',null).classed('map mapNotClicked',true);

							searchedMap.attr('style', null).attr('class', null).classed('map mapClicked', true);
							
							fltr_circles_int = fltr_circles
								.filter(function()
									{return d3.select(this).classed('circleHighlighted')||d3.select(this).classed('circleHighlighted_war')}
									)
								.attr('class', function(d){return d.war ==0?'dispute intersected' : 'war intersected'})

							fltr_circles_int_allied = fltr_circles_int.filter( function(d_){
								return (include(d_.countries_A,  searchedMap.data()[0].properties.COWCODE) && include(d_.countries_A, storedSelection1.COWCODE)) ||
									   (include(d_.countries_B,  searchedMap.data()[0].properties.COWCODE) && include(d_.countries_B, storedSelection1.COWCODE))
									}).classed('allied', true);

						
							fltr_circles_int_hostile = fltr_circles_int.filter( function(d_){
								return !(
									   (include(d_.countries_A,  searchedMap.data()[0].properties.COWCODE) && include(d_.countries_A, storedSelection1.COWCODE)) ||
									   (include(d_.countries_B,  searchedMap.data()[0].properties.COWCODE) && include(d_.countries_B, storedSelection1.COWCODE))
									   )
									}).classed('hostile', true);

							fltr_circles_int_war = fltr_circles
								.filter(function()
									{return d3.select(this).classed('war intersected')}
									);


							fltr_circles_int.transition().attr('r',2).transition().attr('r',4);


							d3.selectAll('.circleHighlighted,.circleHighlighted_war').attr('style',null).attr('class', function(d){return d.war==0? 'dispute circleNotClicked transparent':'war circleNotClicked transparent' }).attr('r',dflt_radius);	
							
							map_clicked = 2;

							describe(searchedMap);
							drawCircle();
							drawLegends(searchedMap.data()[0]);

						}

						else{

							g_map.selectAll('.mapFiltered').style('fill',null).style('stroke',null).classed('map mapNotClicked',true);

							searchedMap.attr('style', null).classed('mapNotClicked', true).classed('mapClicked',false);

							
							map_clicked = 0;

							drawLegends(searchedMap.data()[0]);
							initialize();
												
						}
					}
				    else{


				    	g_map.selectAll('path.map').attr('style', null).classed('mapNotClicked', true).classed('mapClicked', false).classed('mapHighlighted', false);
						
						initialize();

						legends.selectAll('.legend_hostile').remove();
						legends.selectAll('.legend_allied').remove();
											
						circle_clicked = false;
						map_clicked = 0;
						drawLegends(searchedMap.data()[0]);

				    }		
				}		
			}

}
