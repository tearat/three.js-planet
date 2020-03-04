var scene = new THREE.Scene()
var mouse = new THREE.Vector2()
var INTERSECTED
var camera, scene, raycaster, renderer, controls
var delta = 0.01
var clickableObjects = [];
var dotObjects = [];
var planetObject = [];
var cloudMesh;
const planetRadius = 1
var cameraPosition = new THREE.Vector3(0, 0, 2)
var newDot = null
var draggingDot = null
var modals = {
    create: {
        isShow: false
    }
}

var paths = {
    planetColor: "tex/ski_color.jpg",
    planetAlpha: "tex/ski_alpha.jpg",
    dot: "tex/dot.png",
    clouds: "tex/clouds.jpg",
    bg: "tex/bg.jpg"
}

var dots = []
$.get( "/api.php?action=load", function( data ) {
    dots = JSON.parse(data)
    init()
    animate()
});

function init() {

    // EARTH
    var planetGeometry = new THREE.SphereGeometry(planetRadius, 64, 64)
    var planetMaterial = new THREE.MeshBasicMaterial()
    var planetMesh = new THREE.Mesh(planetGeometry, planetMaterial)
    planetMesh.name = "Earth"

    var planetTexture = new THREE.TextureLoader().load( paths.planetColor )
    var planetTextureAlpha = new THREE.TextureLoader().load( paths.planetAlpha )
    planetMaterial.map = planetTexture
    // planetMaterial.alphaMap = planetTextureAlpha
    planetMaterial.transparent = true
    planetMaterial.bumpScale = 0.05

    planetMaterial.depthWrite = false
    // planetMaterial.side = THREE.DoubleSide
    clickableObjects.push(planetMesh)
    planetObject.push(planetMesh)

    scene.add(planetMesh)

    // CLOUDS
    var cloudTexture = new THREE.TextureLoader().load( paths.clouds );
    var cloudGeometry = new THREE.SphereGeometry(planetRadius + 0.02, 32, 32)
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
    var canvas = document.getElementById("three");
    renderer = new THREE.WebGLRenderer({ canvas: canvas });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Camera
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
    camera.lookAt( new THREE.Vector3(0,0,0) );

    // DOTS
    dots.forEach(dot => {
        let dotMesh = createDot(dot)
        createTextNode(dot)
    })

    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enablePan = false
    controls.enableDamping = true
    controls.enableRotate = true
    controls.minDistance = 1.25
    controls.maxDistance = 4
    controls.minPolarAngle = Math.PI * 0.1
    controls.maxPolarAngle = Math.PI * 0.9
    controls.rotateSpeed = 0.5
    controls.mouseButtons = {
    	RIGHT: THREE.MOUSE.ROTATE
    }
    controls.update();

    // Raycaster
    raycaster = new THREE.Raycaster();

    renderer.domElement.addEventListener('mousemove', onDocumentMouseMove, false);
    renderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false);
    renderer.domElement.addEventListener('mouseup', onDocumentMouseUp, false);
    renderer.domElement.addEventListener("click", onDocumentMouceClick, true);
    renderer.domElement.addEventListener("dblclick", onDocumentMouseDoubleClick, true);
}

function toScreenPosition(obj, camera)
{
    var vector = new THREE.Vector3();

    var widthHalf = 0.5 * renderer.getContext().canvas.width;
    var heightHalf = 0.5 * renderer.getContext().canvas.height;

    obj.updateMatrixWorld();
    vector.setFromMatrixPosition(obj.matrixWorld);
    vector.project(camera);

    vector.x = ( vector.x * widthHalf ) + widthHalf;
    vector.y = - ( vector.y * heightHalf ) + heightHalf;

    return {
        x: vector.x,
        y: vector.y
    }
}

function showCreateModal() {
    modals.create.isShow = true
    $("#new-geo-input").val("")
    $("#new-geo-modal").fadeIn()
    $("#new-geo-input").focus()
}

function hideCreateModal() {
    modals.create.isShow = false
    $("#new-geo-modal").fadeOut()
}

$("#new-geo-submit").click(() => {
    createSendForm()
})

$("#new-geo-cancel").click(() => {
    hideCreateModal()
})

document.addEventListener('keydown', function(event) {
    if ( (event.code == "Enter" || event.code == "NumpadEnter") && modals.create.isShow ) {
        createSendForm()
    }
});

function createSendForm() {
    let title = $("#new-geo-input").val().trim()
    if( title != "" )
    {
        newDot.title = title
        $.ajax({
            type: "POST",
            url: "/api.php?action=add",
            data: {
                title: newDot.title,
                asimuth: newDot.asimuth,
                polar: newDot.polar,
            },
            success: (res) => {
                newDot.id = res
                createDot(newDot)
                createTextNode(newDot)
                newDot = null
                hideCreateModal()
            }
        })
    }
}

function createTextNode(dot)
{
    var spanNode = document.createElement("span")
    spanNode.innerHTML = dot.title
    $(spanNode).addClass("geo-title");
    $(spanNode).attr("id", "dot_" + dot.id)
    document.body.appendChild(spanNode)
}


function render() {
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(dotObjects);

    if (intersects.length) {
        INTERSECTED = intersects[0].object;
        INTERSECTED.scale.x = 2
        INTERSECTED.scale.y = 2
    } else {
        dotObjects.forEach(dot => {
            dot.scale.x = 1
            dot.scale.y = 1
        })
        INTERSECTED = null;
    }

    renderer.render(scene, camera);
}

function onDocumentMouceClick(event) {
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(dotObjects);
    if (intersects.length > 0) {
        INTERSECTED = intersects[0].object
        if( event.ctrlKey && event.button == 0 ) {
            if ( !confirm("Delete?") ) return false
            $.ajax({
                type: "POST",
                url: "/api.php?action=delete",
                data: {
                    id: INTERSECTED.dataId,
                },
                // success: (res) => {
                    // console.log(res)
                // },
            });
            $("#dot_" + INTERSECTED.dataId).remove()
            scene.remove( INTERSECTED )
        }
    }
}

function onDocumentMouseDoubleClick(event) {
    console.log("Double click")
    raycaster.setFromCamera(mouse, camera)
    var intersects = raycaster.intersectObjects(planetObject)
    if (intersects.length > 0) {
        if (INTERSECTED.name == "Earth") {
            let intersectPoint = intersects[0].point
            let x = intersectPoint.x
            let y = intersectPoint.y
            let z = intersectPoint.z
            let asimuth = 1 * Math.atan2( x, z )
            let polar = Math.atan( y / Math.sqrt( (x*x) + (z*z) ) )
            asimuth = -asimuth * (180 / Math.PI) // degrees to radians?
            polar = polar * (180 / Math.PI) // degrees to radians?

            newDot = {
                asimuth: asimuth,
                polar: polar,
                size: 0.025
            }
            showCreateModal()
        }
    }
}

function onDocumentMouseMove(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    mouse.clientX = event.clientX
    mouse.clientY = event.clientY
}

function onDocumentMouseDown(event) {
    if( event.button == 0 ) {
        raycaster.setFromCamera(mouse, camera);
        var intersects = raycaster.intersectObjects(dotObjects);
        if (intersects.length > 0) {
            draggingDot = null
            draggingDot = intersects[0].object
            $('html,body').css('cursor', 'move')
        }
    }
}

function onDocumentMouseUp(event) {
    raycaster.setFromCamera(mouse, camera)
    var intersects = raycaster.intersectObjects(planetObject)
    if (intersects.length > 0) {
        INTERSECTED = intersects[0].object
        if (INTERSECTED.name == "Earth" && draggingDot) {
            // console.log("up to:", INTERSECTED)
            let intersectPoint = intersects[0].point
            let x = intersectPoint.x
            let y = intersectPoint.y
            let z = intersectPoint.z
            let asimuth = 1 * Math.atan2( x, z ) // Radians
            let polar = Math.atan( y / Math.sqrt( (x*x) + (z*z) ) ) // Radians

            let rotation = {
                asimuth: asimuth,
                polar: polar
            }
            moveDot(draggingDot, rotation)
            draggingDot = null
            $('html,body').css('cursor', 'default')
        }
    }
}

function createDot(dot) {
    var dotTexture = new THREE.TextureLoader().load( paths.dot );
    // TODO: get point size from DB
    // var dotSize = dot.size ? dot.size : 0.0125 // 0.025
    var dotSize = 0.005 // 0.025
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
    dotMesh.name = "Dot" // Mesh name for events
    dotMesh.dataId = dot.id
    dotMesh.title = dot.title
    let asimuthDeg = dot.asimuth * (Math.PI / 180) // Degreess to radians
    let polarDeg = dot.polar * (Math.PI / 180) // Degreess to radians
    dotMesh.rotateY(-asimuthDeg) // Azimuth rotation
    dotMesh.rotateX(-polarDeg) // Polar rotation
    dotMesh.translateZ(planetRadius) // Translate to planet radius
    clickableObjects.push(dotMesh) // Add dot to clickable objects array
    dotObjects.push(dotMesh) //  Add dot to dot objects array

    scene.add(dotMesh)
    return dotMesh
}

function moveDot(dot, rotation) {
    dot.position.x = 0
    dot.position.y = 0
    dot.position.z = 0
    dot.rotation.x = 0
    dot.rotation.y = 0
    dot.rotation.z = 0

    dot.rotateY(rotation.asimuth) // Azimuth rotation (degrees)
    dot.rotateX(-rotation.polar) // Polar rotation (degrees)
    dot.translateZ(planetRadius)

    $.ajax({
        type: "POST",
        url: "/api.php?action=update",
        data: {
            id: dot.dataId,
            asimuth: -rotation.asimuth * (180 / Math.PI), // to degrees
            polar: rotation.polar * (180 / Math.PI), // to degrees
        },
        // success: (res) => {
        //     console.log(res)
        // }
    })
}

function animate() {
    requestAnimationFrame(animate);
    cloudMesh.rotation.y  += 1/32 * delta

    let dx = camera.position.x
    let dy = camera.position.y
    let dz = camera.position.z
    let cameraDistance = Math.sqrt( dx * dx + dy * dy + dz * dz )

    dotObjects.forEach(dotMesh => {
        let spanNode = $("#dot_" + dotMesh.dataId)[0]

        let dx = camera.position.x - dotMesh.position.x
        let dy = camera.position.y - dotMesh.position.y
        let dz = camera.position.z - dotMesh.position.z
        let deltaCameraDot = Math.sqrt( dx * dx + dy * dy + dz * dz )

        if( deltaCameraDot < (cameraDistance * 0.75) && cameraDistance < 2.5 ) {
            dotMesh.visible = true
            $(spanNode).fadeIn()
            let left = Math.floor(toScreenPosition(dotMesh, camera).x)
            let top = Math.floor(toScreenPosition(dotMesh, camera).y)
            $(spanNode).css("font-size", (20 / cameraDistance) + "px")
            $(spanNode).css("left", left + (20 / cameraDistance) + "px")
            $(spanNode).css("top", top - (20 / cameraDistance) + "px")
        } else {
            dotMesh.visible = false
            $(spanNode).fadeOut()
        }
    })

    controls.update();
    render();
}
