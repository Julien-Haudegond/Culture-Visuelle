import h from './framework/h'
import { ArticleDescriptionAndPosition } from './articles/ArticleDescription'
import ArticleThumbnail from './components/ArticleThumbnail'
import ArticleInfos from './components/ArticleInfos'
import createBG from './background/main'
import Point from './components/Point'
import perlin from 'perlin.js'
import PoissonDiskSampling from 'poisson-disk-sampling'
// Articles
import ArticlesDescription from './ArticlesDescription'

const articles: ArticleDescriptionAndPosition[] = []

// Generate ArticlesDescription
const pds = new PoissonDiskSampling({ shape: [1, 1], minDistance: 0.15, maxDistance: 0.3, tries: 10});
pds.addPoint([0.5, 0.5]) // init with a point in the center
const pointsSampling = pds.fill() // generate poisson disk sampling

ArticlesDescription.forEach((d, id) => {
    // Use our generated poison disk sampling and add random fallback if needed
    let randomPos: Point = pointsSampling[id] != null ? Point.fromArray(pointsSampling[id]).addScalar(0.25) : Point.random();

    articles.push({
        desc: d,
        currentPos: randomPos,
        initPos: randomPos
    })
})

const edges = [
    [0, 1],
    [0, 2],
    [4, 1],
    [3, 4],
    [6, 2],
    [7, 8],
    [8, 6],
    [5, 4],
    [5, 6],
    [11, 9],
    [25, 8],
    [16, 17],
    [10, 24],
    [22, 24],
    [10, 22],
    [12, 22],
    [10, 11],
    [11, 6],
    [26, 24],
    [23, 17],
    [23, 8],
    [4, 23],
    [3, 17],
    [16, 19],
    [14, 15],
    [7, 15],
    [7, 20],
    [14, 20],
    [15, 21],
    [25, 21],
    [2, 13],
    [12, 26],
    [16, 18],
]

let prevMouse: Point
let isDragging = false
let currentHoveArticle = undefined
const jitterSpeed = 0.001
let time = 0

var bg = createBG()

bg.linkGraph(articles, edges)

const jitterPos = function() {
    articles.forEach((a, id) => {
        const delta = new Point(perlin.simplex2(id, time*jitterSpeed), perlin.simplex2(2752.12 + id, time*jitterSpeed))
        a.currentPos = a.initPos.clone().add(delta.divideScalar(40))
    })
    ++time
}

const init = () => {
    document.getElementById("app").innerHTML = h('div', {}, articles.map((article, idx) => ArticleInfos(article.desc, idx)))
    + h('div',
    {
        id: 'transform-wrapper',
        style: `
            transform-origin: top left;
            transform: matrix(${bg.myScale}, 0, 0, ${bg.myScale}, ${bg.translation.x}, ${bg.translation.y});
        `,
    }, 
        articles.map((article, idx) => ArticleThumbnail(article, idx, 50))
    )
}

const draw = () => {

    // jitterPos()
    for (let i = 0; i < articles.length; i++) {
        document.getElementById(`article-thumbnail-${i}`).style.left = `calc(${articles[i].currentPos.x * 100}vw - 50px`;
        document.getElementById(`article-thumbnail-${i}`).style.top = `calc(${articles[i].currentPos.y * 100}vh - 50px`;
    }
    
    requestAnimationFrame(draw);
}

window.addEventListener('articleHovered', e => {
    if(currentHoveArticle == undefined) {
        currentHoveArticle = e.detail.idx
        
        bg.onHoverStart(currentHoveArticle)
        document.getElementById('article-'+currentHoveArticle).classList.add('visible')
    }

})
window.addEventListener('mousemove', e => {
    if (e.target.id === "defaultCanvas0") {
        bg.onHoverEnd()
        for (let i = 0; i < articles.length; ++i)
            document.getElementById('article-'+i).classList.remove('visible')
        currentHoveArticle = undefined
    }
})
init()
draw()

window.addEventListener("wheel", (e: WheelEvent) => {
    const s = Math.pow(0.95, e.deltaY > 0 ? 1 : -1)
    bg.myScale *= s
    const delta: Point = Point.fromObject(e);
    bg.translation.subtract(delta).multiplyScalar(s).add(delta);
    document.getElementById(`transform-wrapper`).style.transform = `matrix(${bg.myScale}, 0, 0, ${bg.myScale}, ${bg.translation.x}, ${bg.translation.y})`;
})

window.addEventListener("mousedown", (e: MouseEvent) => {
    isDragging = true
    prevMouse = Point.fromObject(e)

    // Added link behavior here because updating the dom elements for the animation cancels the "onclick" mechanism.
    if(currentHoveArticle != undefined) {
        window.location.href = `./${articles[currentHoveArticle].desc.folderName}.html`
    }
})

window.addEventListener("mouseup", (e: MouseEvent) => {
    isDragging = false
})

window.addEventListener("mousemove", (e: MouseEvent) => {
    if (isDragging) {
        const delta: Point = Point.fromObject(e);
        bg.translation.add(delta.subtract(prevMouse))
        prevMouse = Point.fromObject(e)
        document.getElementById(`transform-wrapper`).style.transform = `matrix(${bg.myScale}, 0, 0, ${bg.myScale}, ${bg.translation.x}, ${bg.translation.y})`;
    }
})