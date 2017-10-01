/*
http://lbs.amap.com/api/javascript-api/summary/
*/

let mapObj;
let fail_to_access_douban = false;

function addBuildings(){  
    if (typeof(Worker) !== "undefined") {  
        let buildings = new AMap.Buildings(); //实例化3D楼块图层  
        buildings.setMap(mapObj);//在map中添加3D楼块图层  
    } else {
        // document.getElementById("info").innerHTML="对不起，运行该示例需要浏览器支持HTML5！";  
    }  
}  

//添加带文本的点标记覆盖物  
function addMarker(){   
    //自定义点标记内容     
    let markerContent = document.createElement("div");  
    markerContent.className = "markerContentStyle";  
      
    //点标记中的图标  
    let markerImg= document.createElement("img");  
     markerImg.className="markerlnglat";  
     markerImg.src="https://webapi.amap.com/images/0.png";     
     markerContent.appendChild(markerImg);  
       
     //点标记中的文本  
     let markerSpan = document.createElement("span");  
     markerSpan.innerHTML = "我是自定义样式的点标记哦！";  
     markerContent.appendChild(markerSpan);  
     marker = new AMap.Marker({  
        map:mapObj,  
        position:mapObj.center, //基点位置  
        offset:new AMap.Pixel(-18,-36), //相对于基点的偏移位置  
        draggable:true,  //是否可拖动  
        content:markerContent   //自定义点标记覆盖物内容  
    });
    marker.setMap(mapObj);  //在地图上添加点  
}

let last_fetched_events = [];

function resetCity(city_key) {

    last_fetched_events = [];

    let show_paid_events = $("#paid-events").is(':checked');
    mapObj = new AMap.Map("iCenter", {
        center: new AMap.LngLat(121.473267,31.222715),
        level:  13,
        // mapStyle: 'amap://styles/graffiti',
    });
    mapObj.plugin(["AMap.ToolBar"], () => {
        toolBar = new AMap.ToolBar();  
        mapObj.addControl(toolBar);
    });

    city = {
        name : cities[city_key][0],
        zoom : cities[city_key][1],
    }

    // mapObj.setCenter(new AMap.LngLat(city.x, city.y));
    mapObj.setCity(city.name);

    // https://github.com/unixcrh/DOUBANTONGCHENG/blob/master/DouBanTongCheng/ContentVC.m
    // https://developers.douban.com/wiki/?title=event_v2
    let doubanEvents = [
        "https://api.douban.com/v2/event/list?loc=__CITY_EN__&type=music&max-results=10&callback=?",
        "https://api.douban.com/v2/event/list?loc=__CITY_EN__&type=drama&max-results=10&callback=?",
        "https://api.douban.com/v2/event/list?loc=__CITY_EN__&type=film&max-results=10&callback=?",
        "https://api.douban.com/v2/event/list?loc=__CITY_EN__&type=exhibition&max-results=10&callback=?",
    ];

    // http://www.flaticon.com/
    const doubanFlatIcons = [
        'media/music-player.png',
        'media/theater.png',
        'media/camera.png',
        'media/college.png',
    ];

    doubanEvents.forEach((doubanEvent, i) => {
        doubanEvent = doubanEvent.replace('__CITY_EN__', city_key);
        const omitter = '/__CITY_CN__(\s+|市title|站)/g'.replace('__CITY_CN__', city_key);
        $.getJSON(doubanEvent)
            .done(json => {
                //response json are now in the json variable
                console.log(json);
                last_fetched_events.push(json);
                json.events.reverse().forEach((ev, j) => {
                    if (!show_paid_events && ev.fee_str !== '免费') {
                        // skip paid events
                        return;
                    }
                    ev.title = ev.title.replace('免费', '')
                    ev.title = ev.title.replace(city_key+'站', '')
                    ev.title = ev.title.replace(city_key+'室', '')
                    ev.title = ev.title.replace(city_key, '')
                    ev.title = ev.title.replace(city_key, '')
                    ev.title = ev.title.replace('中国', '')
                    // ev.title = ev.title.replace(omitter, '')
                    let geo = ev.geo.split(' ');
                    let marker = new AMap.Marker({
                        map:        mapObj,
                        position:   new AMap.LngLat(geo[1], geo[0]),
                        icon:       doubanFlatIcons[i],
                        // icon:       ev.owner.alt.match('site') ? new AMap.Icon({
                        //                 image: ev.owner.avatar,
                        //             }) : null,
                        // label:      "vvvvvv",
                        title:      ev.title + '\n' + 
                                    ev.address.replace(omitter, '') + '\n' + 
                                    ev.begin_time.substring(5, ev.begin_time.length - 3) + ' ~ ' + 
                                    ev.end_time.substring(5, ev.end_time.length - 3)
                    });

                    // ev.price_range = ev.price_range.replace('免费', 'FREE');
                    marker.setLabel({//label默认蓝框白底左上角显示，样式className为：amap-marker-label
                        offset: new AMap.Pixel(26, 0),//修改label相对于maker的位置
                        content: '¥ '+ ev.price_range + ' ' + ev.title
                    });

                    AMap.event.addListener(marker, 'click', () => {
                        // marker_.setContent(ev.content);
                        window.open(ev.alt,'mywin','');
                    });
                });

                document.title = '北上广艺术地图 - ' + city.name;
                mapObj.setZoomAndCenter(city.zoom)
            })
            .fail(( jqxhr, textStatus, error ) => {                
                if (!fail_to_access_douban) {
                    let err = textStatus + ", " + error;
                    alert( "Access douban failed: " + err );
                }
                fail_to_access_douban = true;
            }); 
    });   
}

function mapInit(){
    // http://lbs.amap.com/api/javascript-api/guide/create-map/mapstye

    for (key in cities) {
        city = cities[key];
        // console.log(city);
        html = '<button type="button" class="btn btn-primary" ' + 'id=' + key + '>' + city[0] + '</button>'
        $('#city_buttons').append(html);
        let city_name = key;
        $('#'+city_name).click(() => {
            console.log(city_name);
            resetCity(city_name);
        });
    }

    // addBuildings();
    // addMarker();

    resetCity('shanghai');
}

$(document).ready(mapInit);