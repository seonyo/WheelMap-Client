var map;
var marker_s, marker_e, marker_p1, marker_p2;
var totalMarkerArr = [];
var drawInfoArr = [];
var resultdrawArr = [];
var latitude;
var longitude;
var previousPosition = null;
var cnt = 0;
var infoData = [];
let reg = /\d{1,3}\m/g;
const mySynth = window.speechSynthesis;
let utterance;
var soundFlag;
let endX;
let endY;
let meter;
let subText;

function openPopup() {
  var popup = document.getElementById("popup");
  popup.style.display = "block";
}

function closePopup() {
  var popup = document.getElementById("popup");
  popup.style.display = "none";
  window.location.href = "index.html";
}

function cancelPopup() {
  var popup = document.getElementById("popup");
  popup.style.display = "none";
}

function sound() {
  var popup = document.getElementById("startPop");
  popup.style.display = "none";
  soundFlag = "Sound";
  initTmap();
}

function noSound() {
  var popup = document.getElementById("startPop");
  popup.style.display = "none";
  soundFlag = "noSound";
  initTmap();
}

function updateMapCenter({ coords, timestamp }) {
  // 현재 위치가 달라졌다면 바꾸기
  if (!previousPosition) {
    previousPosition = coords;
    return;
  }

  var latitudeChange = Math.abs(latitude - previousPosition.latitude);
  var longitudeChange = Math.abs(longitude - previousPosition.longitude);

  map.setCenter(new Tmapv2.LatLng(coords.latitude, coords.longitude));

  marker_s.setPosition(new Tmapv2.LatLng(coords.latitude, coords.longitude));

  var point = new ol.geom.Point([longitude, latitude]).transform("EPSG:4326", "EPSG:3857");

  var olChange0 = Math.abs(infoData[cnt].coordinate[0] - Math.floor(point.flatCoordinates[0]));
  var olChange1 = Math.abs(infoData[cnt].coordinate[1] - Math.floor(point.flatCoordinates[1]));

  if (olChange0 <= 20 && olChange1 <= 20) {
    cnt++;
    // alert(cnt);
    textDescription = infoData[cnt - 1].description.replace(infoData[cnt - 1].description.match(reg)[0], "");
    textDescription = textDescription.replace(" 을 ", " ");

    document.getElementById("meter").innerHTML = infoData[cnt - 1].description.match(reg)[0];
    document.getElementById("subText").innerHTML = textDescription;

    if (textDescription.includes("좌회전")) {
      var imgElement = document.getElementById("Img");
      imgElement.src = "image/rightArrow.png"
      console.log("좌회전");
    }
    else if (textDescription.includes("우회전")) {
      var imgElement = document.getElementById("Img");
      imgElement.src = "image/leftArrow.png";
      console.log("우회전")
    }
    else {
      var imgElement = document.getElementById("Img");
      imgElement.src = "image/straightArrow.png";
      console.log("직진");
    }
    meter = infoData[cnt - 1].description.match(reg)[0];
    subText = textDescription;
    textSpeach(meter, subText);

  }

  console.log(point.flatCoordinates);
  latitude = coords.latitude;
  longitude = coords.longitude;
}

async function initTmap() {
  try {
    await getUserLocation();
    initializeMap();
  } catch (error) {
    console.log("Error");
  }
}

// 페이지가 로딩이 된 후 호출하는 함수입니다.
function initializeMap() {
  // 경로탐색 API 사용요청
  var headers = {};
  headers["appKey"] = "q1hz24YqUC7g84TRhAW3v8a52xq51B3472o9tPeF";
  // T지도가 들어갈 div, 넓이, 높이를 설정합니다.
  map = new Tmapv2.Map("map", { // 지도가 생성될 div
    center: new Tmapv2.LatLng(latitude, longitude),
    width: "100%",	// 지도의 넓이
    height: "100%",	// 지도의 높이
    zoom: 19 // 지도 줌레벨
  });

  // 시작 심볼 찍기
  marker_s = new Tmapv2.Marker(
    {
      position: new Tmapv2.LatLng(),
      icon: "image/MyLocationMarker.png",
      iconSize: new Tmapv2.Size(20, 20),
      map: map
    }
  )

  // 도착 심볼 찍기
  marker_e = new Tmapv2.Marker(
    {
      position: new Tmapv2.LatLng( localStorage.getItem("endY"),  localStorage.getItem("endX")),
      icon: "image/EndLocationMarker.png",
      iconSize: new Tmapv2.Size(36, 50),
      map: map
    });

  // 데이터 넣기 
  $.ajax({
    method: "POST",
    headers: headers,
    url: "https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=json&callback=result",
    async: false,
    data: {
      "startX": longitude.toString(),
      "startY": latitude.toString(),
      "endX": localStorage.getItem("endX"),
      "endY": localStorage.getItem("endY"),
      "resCoordType": "EPSG3857",
      "startName": "출발지",
      "endName": "도착지"
    },
    // 성공 했다면 응답 받기
    success: function (response) {
      console.log(response);
      var resultData = response.features;
      // 기존 그려진 라인 & 마커가 있다면 초기화
      if (resultdrawArr.length > 0) {
        for (var i in resultdrawArr) {
          resultdrawArr[i].setMap(null);
        }
        resultdrawArr = [];
      }

      drawInfoArr = [];

      for (var i in resultData) { // for문 [S]
        var geometry = resultData[i].geometry;
        var properties = resultData[i].properties;
        var polyline_;
        let info =
        {
          "coordinate": geometry.coordinates,
          "description": properties.description
        };

        if (geometry.type == "Point") {
          infoData.push(info);
        }

        if (geometry.type == "LineString") {
          for (var j in geometry.coordinates) {
            // 경로들의 결과값(구간)들을 포인트 객체로 변환
            var latlng = new Tmapv2.Point(
              geometry.coordinates[j][0],
              geometry.coordinates[j][1]);
            // 포인트 객체를 받아 좌표값으로 변환
            var convertPoint = new Tmapv2.Projection.convertEPSG3857ToWGS84GEO(latlng);
            // 포인트객체의 정보로 좌표값 변환 객체로 저장
            var convertChange = new Tmapv2.LatLng(
              convertPoint._lat,
              convertPoint._lng);
            // 배열에 담기
            drawInfoArr.push(convertChange);
          }
        } else {
          var markerImg = "";
          var pType = "";
          var size;

          if (properties.pointType == "S") { // 출발지 마커
            markerImg = "http://tmapapi.sktelecom.com/upload/tmap/marker/pin_r_m_s.png";
            pType = "S";
            size = new Tmapv2.Size(24, 38);
          } else if (properties.pointType == "E") { // 도착지 마커
            markerImg = "http://tmapapi.sktelecom.com/upload/tmap/marker/pin_r_m_e.png";
            pType = "E";
            size = new Tmapv2.Size(24, 38);
          } else { // 각 포인트 마커
            markerImg = "http://topopen.tmap.co.kr/imgs/point.png";
            pType = "P";
            size = new Tmapv2.Size(8, 8);
          }

          // 경로들의 결과값들을 포인트 객체로 변환
          var latlon = new Tmapv2.Point(
            geometry.coordinates[0],
            geometry.coordinates[1]);

          // 포인트 객체를 받아 좌표값으로 다시 변환
          var convertPoint = new Tmapv2.Projection.convertEPSG3857ToWGS84GEO(latlon);

          var routeInfoObj = {
            markerImage: markerImg,
            lng: convertPoint._lng,
            lat: convertPoint._lat,
            pointType: pType
          };

          // Marker 추가
          marker_p = new Tmapv2.Marker(
            {
              position: new Tmapv2.LatLng(
                routeInfoObj.lat,
                routeInfoObj.lng),
              icon: routeInfoObj.markerImage,
              iconSize: size,
              map: map
            });
        }
      } // for문 [E]

      drawLine(drawInfoArr);
      console.log(infoData);
      localStorage.setItem("navigation", JSON.stringify(infoData));
      console.log(JSON.parse(localStorage.getItem("navigation")));
      let navigation = JSON.parse(localStorage.getItem("navigation"));

      let textDescription = navigation[cnt].description.replace(navigation[cnt].description.match(reg)[0], "");
      textDescription = textDescription.replace(" 을 ", " ")
      console.log(navigation[cnt].description.match(reg)[0]);

      document.getElementById("meter").innerHTML = navigation[cnt].description.match(reg)[0];
      document.getElementById("subText").innerHTML = textDescription;
      meter =  navigation[cnt].description.match(reg)[0];
      subText = textDescription;
      if (textDescription.includes("좌회전")) {
        var imgElement = document.getElementById("Img");
        imgElement.src = "image/rightArrow.png"
        console.log("좌회전");
      }
      else if (textDescription.includes("우회전")) {
        var imgElement = document.getElementById("Img");
        imgElement.src = "image/leftArrow.png";
        console.log("우회전");
      }
      else {
        var imgElement = document.getElementById("Img");
        imgElement.src = "image/straightArrow.png";
        console.log("직진");
      }
      navigator.geolocation.watchPosition(updateMapCenter);
    },
    error: function (request, status, error) {
      console.log("code:" + request.status + "\n"
        + "message:" + request.responseText + "\n"
        + "error:" + error);
    }
  });

  function addComma(num) {
    var regexp = /\B(?=(\d{3})+(?!\d))/g;
    return num.toString().replace(regexp, ',');
  }

  function drawLine(arrPoint) {
    var polyline_;

    polyline_ = new Tmapv2.Polyline({
      path: arrPoint,
      strokeColor: "#FFC700",
      strokeWeight: 8,
      map: map
    });
    resultdrawArr.push(polyline_);
  }
}

function textSpeach(meter, speach) {
  utterance = new SpeechSynthesisUtterance(meter + " " + speach);
  mySynth.speak(utterance);
  console.log(utterance);
}

// 위치 정보를 가져오는 비동기 함수
function getUserLocation() {
  return new Promise(function (resolve, reject) {
    navigator.geolocation.watchPosition(function (position) {
      latitude = position.coords.latitude;
      longitude = position.coords.longitude;

      previousPosition = position;

      resolve();
    }, function (error) {
      reject(error);
    });
  });
}
