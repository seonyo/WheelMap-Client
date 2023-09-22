var map;
var latitude;
var longitude;

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

// 위치 정보를 가져오는 비동기 함수
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
// 페이지가 로딩이 된 후 호출하는 함수입니다.
async function initializeMap() {
    try {
        await getUserLocation();
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
            });
    } catch (error) {
        console.error("Error initializing map:", error);
    }

}

async function initTmap() {
    try {
        await getUserLocation();
        initializeMap();
    } catch (error) {
        console.log("Error");
    }
}
function detectLocationChange({ coords, timestamp }) {
    latitude = coords.latitude;   // 위도
    longitude = coords.longitude; // 경도
}

