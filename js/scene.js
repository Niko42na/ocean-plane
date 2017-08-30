//Кольорова гамма
var Colors = {
    red:0x960500,
    white:0xd8d0d1,
    pink:0xF5986E,
    brown:0x59332e,
    brownDark:0x23190f,
    blue:0x2f5591,
};
// THREEJS RELATED VARIABLES
var scene,
    camera, fieldOfView, aspectRatio, nearPlane, farPlane,
    renderer, container;
//Екранні змінні
var HEIGHT, WIDTH;
//INIT THREE JS, SCREEN AND MOUSE EVENTS
function createScene() {
  // отримуємо ширину/висоту екрану,
  // використовуємо їх для налаштування відношення сторін камери
  // і розміру рендерера
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  // Створюємо сцену
  scene = new THREE.Scene();
  // Створюємо камеру
  aspectRatio = WIDTH / HEIGHT;
  fieldOfView = 60;
  nearPlane = 1;
  farPlane = 10000;
  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
    );
  // додамо ефект туману для сцени (колір)
  scene.fog = new THREE.Fog(0xf7d9aa, 100,950);
  camera.position.x = 0;
  camera.position.z = 200;
  camera.position.y = 100;
  // Створюємо рендерер
  renderer = new THREE.WebGLRenderer({ 
    // встановлюємо прозорість аби показати градіентний бекграунд з css
    alpha: true, 
    // згладжування (не сильно потрібно, бо у нас лоу-полі сцена)
    antialias: true 
  });
  // встановлюємо розмір рендерера (тут це буде весь екран)
  renderer.setSize(WIDTH, HEIGHT);
  // Встановлюємо рендерінг тіней
  renderer.shadowMap.enabled = true;
  // Додаємо ДОМ елемент на сторінку в контейнер створений нами
  container = document.getElementById('world');
  container.appendChild(renderer.domElement);
  // Спостерігаємо за розміром екрану - якщо юзер змінить розмір, 
  // то камера і рендерер обновляться
  window.addEventListener('resize', handleWindowResize, false);
}
// Функція обновлення екрану
function handleWindowResize() {
  // обновлення розмірів камери та рендерера
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  renderer.setSize(WIDTH, HEIGHT);
  camera.aspect = WIDTH / HEIGHT;
  camera.updateProjectionMatrix();
}
// Освітлення
var ambientLight, hemisphereLight, shadowLight;

function createLights() {
  // Розсіяне освітлення (градіентне кольорове освітлення)
  // перший параметр - колір неба, 
  // другий - колір поверхні, 
  // третій - інтенсивність світла
  hemisphereLight = new THREE.HemisphereLight(0xaaaaaa,0x000000, .9);
  // навколишнє освітлення - змінює глобальний колір сцени і робить тінь м'якшою
  ambientLight = new THREE.AmbientLight(0xdc8874, .5);
  // Спрямоване освітлення (світить з певного напрямку)
  // Світить як проектор, тобто всі промені - паралельні
  shadowLight = new THREE.DirectionalLight(0xffffff, .9);
  // Встановлюємо напрям світла
  shadowLight.position.set(150, 350, 350);
  // Дозволяємо створення тіней
  shadowLight.castShadow = true;
  // визначаємо видиму область проектованої тіні
  shadowLight.shadow.camera.left = -400;
  shadowLight.shadow.camera.right = 400;
  shadowLight.shadow.camera.top = 400;
  shadowLight.shadow.camera.bottom = -400;
  shadowLight.shadow.camera.near = 1;
  shadowLight.shadow.camera.far = 1000;
   // визначаємо розмір тіні - чим вище, тим краще, але і більш вимогливе до ресурсів 
  shadowLight.shadow.mapSize.width = 2048;
  shadowLight.shadow.mapSize.height = 2048;
  // Щоб активувати ОСВІТЛЕННЯ, просто додамо їх на сцену
  scene.add(hemisphereLight);
  scene.add(shadowLight);
  scene.add(ambientLight);
}
// ОБЄКТИ
// пілот
var Pilot = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "pilot";
  // ця величина потрібна для анімації зачіски
  this.angleHairs=0;
  // тіло пілота
  var bodyGeom = new THREE.BoxGeometry(15,15,15);
  var bodyMat = new THREE.MeshPhongMaterial({color:Colors.brown, shading:THREE.FlatShading});
  var body = new THREE.Mesh(bodyGeom, bodyMat);
  body.position.set(2,-12,0);
  this.mesh.add(body);
  // лице пілота
  var faceGeom = new THREE.BoxGeometry(10,10,10);
  var faceMat = new THREE.MeshLambertMaterial({color:Colors.pink});
  var face = new THREE.Mesh(faceGeom, faceMat);
  this.mesh.add(face);
  // волосся пілота
  var hairGeom = new THREE.BoxGeometry(4,4,4);
  var hairMat = new THREE.MeshLambertMaterial({color:Colors.brown});
  var hair = new THREE.Mesh(hairGeom, hairMat);
  // Зіставимо форму волосся до його нижньої межі, що дозволить його легше масштабувати.
  hair.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0,2,0));
  // контейнер для волосся
  var hairs = new THREE.Object3D();
  // створюємо контейнер для волосся у верхній частині
  // голови (волосся, яке буде анімоване)
  this.hairsTop = new THREE.Object3D();
  // створити волосся у верхній частині голови
  // і розташувати їх на сітці 3 х 4
  for (var i=0; i<12; i++){
    var h = hair.clone();
    var col = i%3;
    var row = Math.floor(i/3);
    var startPosZ = -4;
    var startPosX = -4;
    h.position.set(startPosX + row*4, 0, startPosZ + col*4);
    this.hairsTop.add(h);
  }
  hairs.add(this.hairsTop);
  // створимо волосся на скроні
  var hairSideGeom = new THREE.BoxGeometry(12,4,2);
  hairSideGeom.applyMatrix(new THREE.Matrix4().makeTranslation(-6,0,0));
  var hairSideR = new THREE.Mesh(hairSideGeom, hairMat);
  var hairSideL = hairSideR.clone();
  hairSideR.position.set(8,-2,6);
  hairSideL.position.set(8,-2,-6);
  hairs.add(hairSideR);
  hairs.add(hairSideL);
  // створимо волосся на потилиці
  var hairBackGeom = new THREE.BoxGeometry(2,8,10);
  var hairBack = new THREE.Mesh(hairBackGeom, hairMat);
  hairBack.position.set(-1,-4,0)
  hairs.add(hairBack);
  hairs.position.set(-5,5,0);

  this.mesh.add(hairs);

  var glassGeom = new THREE.BoxGeometry(5,5,5);
  var glassMat = new THREE.MeshLambertMaterial({color:Colors.brown});
  var glassR = new THREE.Mesh(glassGeom,glassMat);
  glassR.position.set(6,0,3);
  var glassL = glassR.clone();
  glassL.position.z = -glassR.position.z

  var glassAGeom = new THREE.BoxGeometry(11,1,11);
  var glassA = new THREE.Mesh(glassAGeom, glassMat);
  this.mesh.add(glassR);
  this.mesh.add(glassL);
  this.mesh.add(glassA);

  var earGeom = new THREE.BoxGeometry(2,3,2);
  var earL = new THREE.Mesh(earGeom,faceMat);
  earL.position.set(0,0,-6);
  var earR = earL.clone();
  earR.position.set(0,0,6);
  this.mesh.add(earL);
  this.mesh.add(earR);
}
// анімація зачіски пілота
Pilot.prototype.updateHairs = function(){
  // отримуємо волосся
  var hairs = this.hairsTop.children;
  // анімуємо їх відповідно до кута
  var l = hairs.length;
  for (var i=0; i<l; i++){
    var h = hairs[i];
    // кожен елемент волосся на голові буде циклічно змінювати свій розмір від 75 до 100 відсотків свого розміру
    h.scale.y = .75 + Math.cos(this.angleHairs+i/3)*.25;
  }
  // інкремент кута для наступного кадру
  this.angleHairs += 0.16;
}
// літак
var AirPlane = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "airPlane";
  // корпус
  var geomCockpit = new THREE.BoxGeometry(120,50,50,1,1,1);
  var matCockpit = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.FlatShading});
  // ми можемо отримати доступ до конкретної вершини форми через
  // масив вершин, а потім змінити його х,у,z величини:
  geomCockpit.vertices[4].y-=10;
  geomCockpit.vertices[4].z+=20;
  geomCockpit.vertices[5].y-=10;
  geomCockpit.vertices[5].z-=20;
  geomCockpit.vertices[6].y+=30;
  geomCockpit.vertices[6].z+=20;
  geomCockpit.vertices[7].y+=30;
  geomCockpit.vertices[7].z-=20;

  var cockpit = new THREE.Mesh(geomCockpit, matCockpit);
  cockpit.position.x = -20;
  cockpit.castShadow = true;
  cockpit.receiveShadow = true;
  this.mesh.add(cockpit);

  // Двигун
  var geomEngine = new THREE.BoxGeometry(20,50,50,1,1,1);
  var matEngine = new THREE.MeshPhongMaterial({color:Colors.white, shading:THREE.FlatShading});
  var engine = new THREE.Mesh(geomEngine, matEngine);
  engine.position.x = 50;
  engine.castShadow = true;
  engine.receiveShadow = true;
  this.mesh.add(engine);

  // Хвіст літака
  var geomTailPlane = new THREE.BoxGeometry(15,20,5,1,1,1);
  var matTailPlane = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.FlatShading});
  var tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
  tailPlane.position.set(-80,20,0);
  tailPlane.castShadow = true;
  tailPlane.receiveShadow = true;
  this.mesh.add(tailPlane);

  // Крила
  var geomSideWing = new THREE.BoxGeometry(30,5,180,1,1,1);
  var matSideWing = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.FlatShading});
  var sideWing = new THREE.Mesh(geomSideWing, matSideWing);
  sideWing.position.set(0,15,0);
  sideWing.castShadow = true;
  sideWing.receiveShadow = true;
  this.mesh.add(sideWing);
  // Скло
  var geomWindshield = new THREE.BoxGeometry(3,15,20,1,1,1);
  var matWindshield = new THREE.MeshPhongMaterial({color:Colors.white,transparent:true, opacity:.3, shading:THREE.FlatShading});;
  var windshield = new THREE.Mesh(geomWindshield, matWindshield);
  windshield.position.set(5,27,0);
  windshield.castShadow = true;
  windshield.receiveShadow = true;
  this.mesh.add(windshield);
  //пропеллер (стійка)
  var geomPropeller = new THREE.BoxGeometry(20,10,10,1,1,1);
  geomPropeller.vertices[4].y-=5;
  geomPropeller.vertices[4].z+=5;
  geomPropeller.vertices[5].y-=5;
  geomPropeller.vertices[5].z-=5;
  geomPropeller.vertices[6].y+=5;
  geomPropeller.vertices[6].z+=5;
  geomPropeller.vertices[7].y+=5;
  geomPropeller.vertices[7].z-=5;
  var matPropeller = new THREE.MeshPhongMaterial({color:Colors.brown, shading:THREE.FlatShading});
  this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
  this.propeller.castShadow = true;
  this.propeller.receiveShadow = true;
  // лопасті
  var geomBlade = new THREE.BoxGeometry(1,80,10,1,1,1);
  var matBlade = new THREE.MeshPhongMaterial({color:Colors.brownDark, shading:THREE.FlatShading});
  // 1 лопасть
  var blade1 = new THREE.Mesh(geomBlade, matBlade);
  blade1.position.set(8,0,0);
  blade1.castShadow = true;
  blade1.receiveShadow = true;
  // 2 лопасть
  var blade2 = blade1.clone();
  blade2.rotation.x = Math.PI/2;
  blade2.castShadow = true;
  blade2.receiveShadow = true;
  // додамо лопасті до пропеллера
  this.propeller.add(blade1);
  this.propeller.add(blade2);
  this.propeller.position.set(60,0,0);
  this.mesh.add(this.propeller);
  // палка колеса (передні)
  var wheelProtecGeom = new THREE.BoxGeometry(30,15,10,1,1,1);
  var wheelProtecMat = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.FlatShading});
  var wheelProtecR = new THREE.Mesh(wheelProtecGeom,wheelProtecMat);
  wheelProtecR.position.set(25,-20,25);
  this.mesh.add(wheelProtecR);
  // колесо шина
  // var wheelTireGeom = new THREE.BoxGeometry(24,24,4);
  var wheelTireGeom = new THREE.CylinderGeometry(12,12,4,20,20);
  wheelTireGeom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI/2));
  var wheelTireMat = new THREE.MeshPhongMaterial({color:Colors.brownDark, shading:THREE.FlatShading});
  var wheelTireR = new THREE.Mesh(wheelTireGeom,wheelTireMat);
  wheelTireR.position.set(25,-28,25);
  // колесо середина
  // var wheelAxisGeom = new THREE.BoxGeometry(10,10,6);
  var wheelAxisGeom = new THREE.CylinderGeometry(5,5,6,20,20);
  wheelAxisGeom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI/2));
  var wheelAxisMat = new THREE.MeshPhongMaterial({color:Colors.brown, shading:THREE.FlatShading});
  var wheelAxis = new THREE.Mesh(wheelAxisGeom,wheelAxisMat);
  wheelTireR.add(wheelAxis);

  this.mesh.add(wheelTireR);

  var wheelProtecL = wheelProtecR.clone();
  wheelProtecL.position.z = -wheelProtecR.position.z ;
  this.mesh.add(wheelProtecL);
  // передні колеса
  var wheelTireL = wheelTireR.clone();
  wheelTireL.position.z = -wheelTireR.position.z;
  this.mesh.add(wheelTireL);
  // позиціювання заднього колеса
  var wheelTireB = wheelTireR.clone();
  wheelTireB.scale.set(.5,.5,.5);
  wheelTireB.position.set(-75,-5,0);
  this.mesh.add(wheelTireB);
  // стійка заднього колеса
  var suspensionGeom = new THREE.BoxGeometry(4,20,4);
  suspensionGeom.applyMatrix(new THREE.Matrix4().makeTranslation(0,10,0))
  var suspensionMat = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.FlatShading});
  var suspension = new THREE.Mesh(suspensionGeom,suspensionMat);
  suspension.position.set(-75,-5,0);
  suspension.rotation.z = -.3;
  this.mesh.add(suspension);

  this.pilot = new Pilot();
  this.pilot.mesh.position.set(-10,27,0);
  this.mesh.add(this.pilot.mesh);

  this.mesh.castShadow = true;
  this.mesh.receiveShadow = true;

};
// небо
Sky = function(){
  // Порожній контейнер
  this.mesh = new THREE.Object3D();
  // кількість хмар на небі
  this.nClouds = 50;
  this.clouds = [];
  // Для того, щоб розподілити хмари послідовно,
  // ми повинні помістити їх у відповідності з єдиним кутом
  var stepAngle = Math.PI*2 / this.nClouds;
  // створення хмар
  for(var i=0; i<this.nClouds; i++){
    var c = new Cloud();
    this.clouds.push(c);
    // встановлюємо позицію і обертання для кожної хмари
    var a = stepAngle*i; // кінцевий кут хмари
    var RandomH = 700 + Math.random()*300;
    var h = RandomH + Math.random()*200; // відстань між центром і хмарою
    // перетворюємо радіальні координати на декартові
    c.mesh.position.y = Math.sin(a)*h;
    c.mesh.position.x = Math.cos(a)*h;
    // для кращого результату, ми ставимо хмари
    // на різну глибину всередині сцени
    c.mesh.position.z = -400-Math.random()*400;
    // обертаємо хмару
    c.mesh.rotation.z = a + Math.PI/2;
    // і ставимо різний розмір
    var s = 1+Math.random()*2;
    c.mesh.scale.set(s,s,s);
    // додамо меш для кожної хмари
    this.mesh.add(c.mesh);
  }
}

// Море
Sea = function(){
  // Створюємо циліндр
  // Задамо параметри: верхній радіус, нижній радіус, 
  // висота, кількість сементів на радіус, кількість вертикальних сегментів
  var geom = new THREE.CylinderGeometry(600,600,800,40,10);
  // повернемо по осі Х
  geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI/2));
  // важливо: шляхом злиття вершин, ми забезпечуємо безперервність хвиль
  geom.mergeVertices();
  // отримуємо вершини
  var l = geom.vertices.length;
  // створюємо масив для зберігання нових даних, пов'язаних з кожною вершиною
  this.waves = [];

  for (var i=0;i<l;i++){
    // отримуємо кожну вершину
    var v = geom.vertices[i];
    // зберігати деякі дані, пов'язані з цією вершиною
    this.waves.push({y:v.y,
                     x:v.x,
                     z:v.z,
                     // рендомний кут
                     ang:Math.random()*Math.PI*2,
                     // рендомна відстань
                     amp:5 + Math.random()*15,
                     // випадкова швидкість (радіан / кадр)
                     speed:.1 + Math.random()*0.032
                    });
  };
  // Створюємо матеріал
  var mat = new THREE.MeshPhongMaterial({
    color:Colors.blue,
    transparent:true,
    opacity:.8,
    shading:THREE.FlatShading,
  });
  // Щоби створити обєкт, ми створюємо поєднання геометрії і матеріалу
  this.mesh = new THREE.Mesh(geom, mat);
  // Додаємо для моря створення тіней
  this.mesh.receiveShadow = true;

}
// тепер створюємо функцію, яка буде викликатися в кожному кадрі
// для оновлення положення вершин (імітація хвиль)
Sea.prototype.moveWaves = function (){
  //отримали вершини
    var verts = this.mesh.geometry.vertices;
    var l = verts.length;

    for (var i=0; i<l; i++){
        var v = verts[i];
        
        // отримали дані вершини
        var vprops = this.waves[i];
        
        // оновили позицію вершини
        v.x = vprops.x + Math.cos(vprops.ang)*vprops.amp;
        v.y = vprops.y + Math.sin(vprops.ang)*vprops.amp;
 
        // інкремент для наступного кадру
        vprops.ang += vprops.speed;
  }
  // повідомляємо рендереру, що геометрія моря змінилась
  this.mesh.geometry.verticesNeedUpdate=true;
  sea.mesh.rotation.z += .005;
}
// Хмара
Cloud = function(){
   // Створюємо порожній контейнер, що триматиме в собі інші частини обєкту
  this.mesh = new THREE.Object3D();
  this.mesh.name = "cloud";
  // Створюємо куб
  // Цю фігуру ми розмножемо для створення хмари
  var geom = new THREE.CubeGeometry(20,20,20);
  // Створюємо матеріал (просто біла поверхня)
  var mat = new THREE.MeshPhongMaterial({
    color:Colors.white,
  });
  // Розмножуємо фігуру рендомну кількість разів (щоби хмари були різні)
  var nBlocs = 3+Math.floor(Math.random()*5);
  for (var i=0; i<nBlocs; i++ ){
    // Поєднуємо (створюємо меш)
    var m = new THREE.Mesh(geom.clone(), mat);
    // Задаємо позицію і обертання кожному кубу рендомно
    m.position.x = i*15;
    m.position.y = Math.random()*10;
    m.position.z = Math.random()*10;
    m.rotation.z = Math.random()*Math.PI*2;
    m.rotation.y = Math.random()*Math.PI*2;
    // задаємо розмір куба рандомно
    var s = .1 + Math.random()*1.2;
    m.scale.set(s,s,s);
    // Додаємо кожному кубу створення і прийом тіні
    m.castShadow = true;
    m.receiveShadow = true;
    // Додамо куб до контейнера
    this.mesh.add(m);
  }
}

// 3D моделі
var sea;
var airplane;

function createPlane(){
  airplane = new AirPlane();
  airplane.mesh.scale.set(.25,.25,.25);
  airplane.mesh.position.y = 100;
  scene.add(airplane.mesh);
}

function createSea(){
  sea = new Sea();
  sea.mesh.position.y = -600;
  scene.add(sea.mesh);
}
// ставимо небо посередині зверху екрану
function createSky(){
  sky = new Sky();
  sky.mesh.position.y = -600;
  scene.add(sky.mesh);
}

function loop(){
  // обновлення літака в кожному кадрі
  updatePlane();
  // обновлення зачіски пілота в кожному кадрі
  airplane.pilot.updateHairs();
  updateCameraFov();
  sea.moveWaves();
  sky.mesh.rotation.z += .01;
  // рендер сцени
  renderer.render(scene, camera);
  // викликаємо знову цю функцію (рекурсія)
  requestAnimationFrame(loop);
}
// анімація літака
function updatePlane(){
  // літак буде переміщуватись між значеннями 25 і 175 по вертикалі
  // і -100 та 100 по горизонталі
  // залежно від позщиції миші (між -1 та 1)
  //  для цього ми використаємо нормалізацію координат (ця функція прописана нижче в коді)
  var targetY = normalize(mousePos.y,-.75,.75,25, 175);
  var targetX = normalize(mousePos.x,-.75,.75,-100, 100);
  // обновлюємо позицію літака
  // рухаємо літак в кожному кадрі шляхом додавання частини залишку відстані 
  airplane.mesh.position.y += (targetY-airplane.mesh.position.y)*0.1;
  // обертаємо літак пропорційно до залишку відстані
  airplane.mesh.rotation.z = (targetY-airplane.mesh.position.y)*0.0128;
  airplane.mesh.rotation.x = (airplane.mesh.position.y-targetY)*0.0064;
  // обертання пропеллера
  airplane.propeller.rotation.x += 0.3;
}

function updateCameraFov(){
  camera.fov = normalize(mousePos.x,-1,1,40, 80);
  camera.updateProjectionMatrix();
}

function normalize(v,vmin,vmax,tmin, tmax){
  var nv = Math.max(Math.min(v,vmax), vmin);
  var dv = vmax-vmin;
  var pc = (nv-vmin)/dv;
  var dt = tmax-tmin;
  var tv = tmin + (pc*dt);
  return tv;
}

// наші основні дії
function init(event){
  // додамо вотчер для контролю рухів мишки
  document.addEventListener('mousemove', handleMouseMove, false);
  createScene();
  createLights();
  createPlane();
  createSea();
  createSky();
  loop();
}

// HANDLE MOUSE EVENTS

var mousePos = { x: 0, y: 0 };
// обробка рухів мишки
function handleMouseMove(event) {
  // тут ми конвертуємо значення координат миші 
  // в значення між -1 і 1;
  // це формула для горизонтальній осі:
  var tx = -1 + (event.clientX / WIDTH)*2;
  // для вертикальної осі, ми повинні інвертувати формулу
  // оскільки 2D вісь у проходить в протилежному напрямку 3D-у-осі
  var ty = 1 - (event.clientY / HEIGHT)*2;
  mousePos = {x:tx, y:ty};
}

window.addEventListener('load', init, false);
