
var map;
var marker_s, marker_e, marker_p1, marker_p2;
var totalMarkerArr = [];
var drawInfoArr = [];
var resultdrawArr = [];
var latitude;
var longitude;
var endX;
var endY;
var address;
var facility_name;
//위치 정보를 가져오는 비동기 함수
function getUserLocation() {
  return new Promise(function (resolve, reject) {
    navigator.geolocation.getCurrentPosition(function (position) {
      latitude = position.coords.latitude;
      longitude = position.coords.longitude;
      resolve();
    }, function (error) {
      reject(error);
    });
  });
}

async function getLocation() {
  const URLParams = new URL(location.href).searchParams;
  endX = URLParams.get("longitude");
  endY = URLParams.get("latitude");
  address = URLParams.get("address");
  facility_name = URLParams.get("facility_name");

  document.getElementById("name").innerHTML = facility_name;
  document.getElementById("address").innerHTML = address;

  localStorage.setItem("endX", endX);
  localStorage.setItem("endY", endY);
  localStorage.setItem("facility_name", facility_name);
}

// 페이지가 로딩이 된 후 호출하는 함수입니다.
function initializeMap() {
  navigator.geolocation.getCurrentPosition(detectLocationChange);
  // api 불러오기
  var headers = {};
  headers["appKey"] = "q1hz24YqUC7g84TRhAW3v8a52xq51B3472o9tPeF";

  // map 생성
  // Tmapv3.Map을 이용하여, 지도가 들어갈 div, 넓이, 높이를 설정합니다.
  map = new Tmapv2.Map("map", { // 지도가 생성될 div
    center: new Tmapv2.LatLng(latitude, longitude),
    width: "100%",   // 지도의 넓이
    height: "95%",   // 지도의 높이
    zoom: 16   // 지도 줌레벨
  });
  // 시작 심볼 찍기
  marker_s = new Tmapv2.Marker(
    {
      position: new Tmapv2.LatLng(latitude, longitude),
      icon: "image/MyLocationMarker.png",
      iconSize: new Tmapv2.Size(14, 14),
      map: map
    }
  )
  // 도착
  marker_e = new Tmapv2.Marker(
    {
      position: new Tmapv2.LatLng(endY, endX),
      icon: "image/EndLocationMarker.png",
      iconSize: new Tmapv2.Size(21, 27),
      map: map
    });

  $.ajax({
    method: "POST",
    headers: headers,
    url: "https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=json&callback=result",
    async: false,
    data: {
      "startX": longitude.toString(),
      "startY": latitude.toString(),
      "endX": endX,
      "endY": endY,
      "resCoordType": "EPSG3857",
      "startName": "출발지",
      "endName": "도착지"
    },
    success: function (response) {
      var resultData = response.features;

      document.getElementById("time").innerHTML = ((resultData[0].properties.totalTime) / 60).toFixed(0) + "분 소요";
      //기존 그려진 라인 & 마커가 있다면 초기화
      if (resultdrawArr.length > 0) {
        for (var i in resultdrawArr) {
          resultdrawArr[i]
            .setMap(null);
        }
        resultdrawArr = [];
      }

      drawInfoArr = [];

      for (var i in resultData) { //for문 [S]
        var geometry = resultData[i].geometry;
        var properties = resultData[i].properties;
        var polyline_;

        if (geometry.type == "LineString") {
          for (var j in geometry.coordinates) {
            // 경로들의 결과값(구간)들을 포인트 객체로 변환
            var latlng = new Tmapv2.Point(
              geometry.coordinates[j][0],
              geometry.coordinates[j][1]);
            // 포인트 객체를 받아 좌표값으로 변환
            var convertPoint = new Tmapv2.Projection.convertEPSG3857ToWGS84GEO(
              latlng);
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

          if (properties.pointType == "S") { //출발지 마커
            markerImg = "http://tmapapi.sktelecom.com/upload/tmap/marker/pin_r_m_s.png";
            pType = "S";
            size = new Tmapv2.Size(24, 38);
          } else if (properties.pointType == "E") { //도착지 마커
            markerImg = "http://tmapapi.sktelecom.com/upload/tmap/marker/pin_r_m_e.png";
            pType = "E";
            size = new Tmapv2.Size(24, 38);
          } else { //각 포인트 마커
            markerImg = "http://topopen.tmap.co.kr/imgs/point.png";
            pType = "P";
            size = new Tmapv2.Size(0, 0);
          }

          // 경로들의 결과값들을 포인트 객체로 변환
          var latlon = new Tmapv2.Point(
            geometry.coordinates[0],
            geometry.coordinates[1]);

          // 포인트 객체를 받아 좌표값으로 다시 변환
          var convertPoint = new Tmapv2.Projection.convertEPSG3857ToWGS84GEO(
            latlon);

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
      }//for문 [E]
      drawLine(drawInfoArr);
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
      strokeWeight: 4,
      map: map
    });
    resultdrawArr.push(polyline_);
  }

}

async function initTmap() {
  try {
    await getLocation();
    await getUserLocation();
    initializeMap();
  } catch (error) {
    console.error(error);
  }
}
function detectLocationChange({ coords, timestamp }) {
  latitude = coords.latitude;   // 위도
  longitude = coords.longitude; // 경도
  console.log("Walk : " + latitude + longitude);
}

function moveToWalk() {
  document.getElementById("startBtn").dataset.longitude = longitude ;
  document.getElementById("startBtn").dataset.latitude = latitude ;
  location.href = `walk.html?latitude=${latitude}&longitude=${longitude}`;
}

let menuOpen = false;

        function toggleMenu() {
            const menubox1 = document.getElementById('menubox1');
            const menubox2 = document.getElementById('menubox2');

            if (menuOpen) {
                menubox1.style.left = '-100%';
                menubox2.style.right = '-100%';
                menuOpen = false;
            } else {
                menubox1.style.left = '0';
                menubox2.style.right = '0';
                menuOpen = true;
            }
        }

        function toggleMenuIcon(element) {
            const navToggle = element;
            const icon = navToggle.querySelector('i');
            if (menuOpen) icon.classList.add('bx-x');
            else icon.classList.remove('bx-x');
        }