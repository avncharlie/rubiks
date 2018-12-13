// three.js globals
var scene;
var camera;
var renderer;
var controls;

// other globals constants
const FIELD_OF_VIEW = 30;
const CAMERA_NEAR_CUTOFF = 0.1;
const CAMERA_FAR_CUTOFF = 1000;
const CAMERA_STARTING_POSITION = [6, 3, 4];
const RENDERER_BACKGROUND = 0xffffff;
const TOTAL_CUBE_SIZE = 2;
const CUBE_STARTING_POSITION = [0, 0, 0];
const CUBE_SPACING_PERCENTAGE = 0;
const CUBE_SPACING = (TOTAL_CUBE_SIZE / 3) * CUBE_SPACING_PERCENTAGE;
const CUBELET_SIZE = (TOTAL_CUBE_SIZE - 3 * CUBE_SPACING) / 3;
const CAMERA_STARTING_LOOKAT = [ CUBELET_SIZE, CUBELET_SIZE, CUBELET_SIZE ];
const ORBITCONTROLS_TARGET = CAMERA_STARTING_LOOKAT;
const LINE_WIDTH = 1;
const STARTING_CUBE_STRING = 'UUUUUUUUUFFFFFFFFFDDDDDDDDDLLLLLLLLLRRRRRRRRRBBBBBBBBB';
const COLOR_MAPPINGS = { U: 0xffffff, F: 0xa60027, D: 0xfecd09, L: 0x128d38, R: 0x03309c, B: 0xfb4007 }

init();
animate();
main();

//var axesHelper = new THREE.AxesHelper( 5 );
//scene.add( axesHelper );
      
var cube; // debugging helper remember to remove this
function main() {
    cube = new Rubiks3d.Cube(
        scene,
        TOTAL_CUBE_SIZE,
        STARTING_CUBE_STRING,
        CUBE_STARTING_POSITION,
        CUBE_SPACING_PERCENTAGE,
        LINE_WIDTH,
        COLOR_MAPPINGS
    );
    cube.visible = true;
}

function init() {
    /*
     * init
     * initialises the scene, camera, renderer, orbitcontrols and sets up an eventListener to rerender the
     * canvas when the window is resized
     */
    
    // init scene
    scene = new THREE.Scene();
    
    // init camera
    camera = new THREE.PerspectiveCamera(
        FIELD_OF_VIEW,
        window.innerWidth/window.innerHeight,
        CAMERA_NEAR_CUTOFF,
        CAMERA_FAR_CUTOFF
     );
    camera.position.set( ...CAMERA_STARTING_POSITION );
    camera.lookAt(new THREE.Vector3( ...CAMERA_STARTING_LOOKAT ));
    
    // init renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( RENDERER_BACKGROUND );
    document.body.appendChild( renderer.domElement );
    
    // init OrbitControls
    controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.target = new THREE.Vector3( ...ORBITCONTROLS_TARGET );
    controls.enablePan = false;
    controls.enableZoom = false;
    
    // trigger rerender when window resized
    window.addEventListener( 'resize', function()  {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
    }, false );   
}

function animate(time) {
    // for tweening updates
    TWEEN.update(time)
    
    // orbitControls update
    controls.update();
    
    // rerender scene
	renderer.render( scene, camera );
    
    // animate
	requestAnimationFrame( animate );
}