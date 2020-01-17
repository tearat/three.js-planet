var scene = new THREE.Scene()
var mouse = new THREE.Vector2()
var INTERSECTED
var camera, scene, raycaster, renderer, controls
var delta = 0.01
var dotsObjects = [];
var cloudMesh;

var paths = {
    planetColor: "tex/earth_color.jpg",
    planetAlpha: "tex/earth_alpha.jpg",
    dot: "tex/dot.png",
    clouds: "tex/clouds.jpg",
    bg: "tex/bg.jpg"
}

function init() {

    // EARTH

    var planetGeometry = new THREE.SphereGeometry(0.5, 32, 32)
    var planetMaterial = new THREE.MeshBasicMaterial()
    var planetMesh = new THREE.Mesh(planetGeometry, planetMaterial)
    planetMesh.name = "Earth"

    var planetTexture = new THREE.TextureLoader().load( paths.planetColor )
    var planetTextureAlpha = new THREE.TextureLoader().load( paths.planetAlpha )
    planetMaterial.map = planetTexture
    planetMaterial.alphaMap = planetTextureAlpha
    planetMaterial.transparent = true
    planetMaterial.bumpScale = 0.05

    planetMaterial.depthWrite = false
    planetMaterial.side = THREE.DoubleSide

    scene.add(planetMesh)


    // DOTS

    var dots = [{
            id: 1,
            title: "Dot az=90 pol=0",
            asimuth: 90,
            polar: 0,
            size: 0.025
        },
        {
            id: 2,
            title: "Dot az=135 pol=0",
            asimuth: 135,
            polar: 0,
        },
        {
            id: 3,
            title: "Dot az=180 pol=0",
            asimuth: 180,
            polar: 0,
        },
        {
            id: 4,
            title: "Dot az=90 pol=45",
            asimuth: 90,
            polar: 45,
        },
    ]

    var dotTexture = new THREE.TextureLoader().load( paths.dot );
    dots.forEach(dot => {
        var dotSize = dot.size ? dot.size : 0.0125 // 0.025
        var dotGeometry = new THREE.PlaneBufferGeometry(dotSize, dotSize, 1);
        var dotMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: .9,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false,
            fog: true,
            map: dotTexture,
        });
        var dotMesh = new THREE.Mesh(dotGeometry, dotMaterial)
        dotMesh.name = "Dot" // Имя для событий
        dotMesh.dataId = dot.id // Это будет подпись при наведении
        dotMesh.title = dot.title // Это будет подпись при наведении
        let asimuthDeg = dot.asimuth * (Math.PI / 180) // Переводим градусы в радианы
        let polarDeg = dot.polar * (Math.PI / 180) // Переводим градусы в радианы
        dotMesh.rotateY(asimuthDeg) // Поврот по азимуту
        dotMesh.rotateX(polarDeg) // Подъём по полярной координате
        dotMesh.translateZ(planetGeometry.parameters.radius) // Поднимаем точку на высоту радиуса планеты, чтобы она была на поверхности
        dotsObjects.push(dotMesh) // Добавляем точку в массив кликабельных и наводимых объектов

        scene.add(dotMesh)
    })



    // CLOUDS

    var cloudTexture = new THREE.TextureLoader().load( paths.clouds );
    var cloudGeometry = new THREE.SphereGeometry(0.51, 32, 32)
    var cloudMaterial = new THREE.MeshBasicMaterial({
        map         : cloudTexture,
        side        : THREE.DoubleSide,
        opacity     : 0.1,
        transparent : true,
        depthWrite  : false,
    })
    cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial)
    scene.add(cloudMesh)


    // BG

    var bgTexture = new THREE.TextureLoader().load( paths.bg );
    var bgGeometry = new THREE.SphereGeometry(10, 32, 32)
    var bgMaterial = new THREE.MeshBasicMaterial({
        map: bgTexture,
        side: THREE.BackSide
    })
    var bgMesh = new THREE.Mesh(bgGeometry, bgMaterial)
    scene.add(bgMesh)


    // Renderer

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);


    // Lights

    // var light = new THREE.DirectionalLight( 0xdddddd, 1 );
    // light.position.set( 80, 80, 80 );
    // scene.add( light );
    // var light = new THREE.DirectionalLight( 0xdddddd, 1 );
    // light.position.set( -80, -80, -80 );
    // scene.add( light );


    // Camera

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 1);

    // Controls

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.update();

    // Raycaster

    raycaster = new THREE.Raycaster();

    document.addEventListener('mousemove', onDocumentMouseMove, false);
    renderer.domElement.addEventListener("click", onclick, true);
}

function onclick(event) {
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(dotsObjects);
    if (intersects.length > 0) {
        INTERSECTED = intersects[0].object
        if (INTERSECTED.name == "Dot") {
            alert("Clicked " + INTERSECTED.dataId)
        }
    }
}

function render() {
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(dotsObjects);

    if (intersects.length) {
        if (INTERSECTED != intersects[0].object) {
            INTERSECTED = intersects[0].object;
            INTERSECTED.scale.x = 2
            INTERSECTED.scale.y = 2
            $('html,body').css('cursor', 'pointer')
            $('#info').show()
            $('#info .title').html(INTERSECTED.title)
            $('#info').css('left', mouse.clientX + 20)
            $('#info').css('top', mouse.clientY + 20)
        }
    } else {
        dotsObjects.forEach(dot => {
            dot.scale.x = 1
            dot.scale.y = 1
        })
        $('#info').fadeOut(100)
        $('html,body').css('cursor', 'default')
        INTERSECTED = null;
    }

    renderer.render(scene, camera);
}

function onDocumentMouseMove(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    mouse.clientX = event.clientX
    mouse.clientY = event.clientY
}

function animate() {
    requestAnimationFrame(animate);
    // planetMesh.rotation.y  += 1/32 * delta
    cloudMesh.rotation.y  += 1/32 * delta
    controls.update();
    render();
}

init();
animate();
