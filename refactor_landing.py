import re

def main():
    with open("frontend/src/pages/LandingPage.jsx", "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Imports
    if "framer-motion" not in content:
        content = content.replace('import { useEffect, useRef, useState } from "react";',
                                  'import { useEffect, useRef, useState } from "react";\nimport { motion, useInView, useAnimation, animate } from "framer-motion";')

    # 2. Add AnimatedCounter before export default function
    counter_comp = """
function AnimatedCounter({ from, to, suffix = "", duration = 1.4 }) {
  const nodeRef = useRef();
  const inView = useInView(nodeRef, { once: true, margin: "-10%" });
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (inView && !prefersReduced) {
      const controls = animate(from, to, {
        duration,
        ease: "easeOut",
        onUpdate(value) {
          if (nodeRef.current) {
            nodeRef.current.textContent = Math.round(value).toLocaleString() + suffix;
          }
        }
      });
      return () => controls.stop();
    } else if (prefersReduced && nodeRef.current) {
      nodeRef.current.textContent = to.toLocaleString() + suffix;
    }
  }, [from, to, inView, suffix, prefersReduced, duration]);

  return <span ref={nodeRef}>{from.toLocaleString()}{suffix}</span>;
}

export default function LandingPage() {"""
    
    if "function AnimatedCounter" not in content:
        content = content.replace("export default function LandingPage() {", counter_comp)

    # 3. Clean up old hooks logic
    # Remove countRefs, barRefs, revealRefs, and their useEffects
    content = re.sub(r'  const countRefs = useRef\(\[\]\);\n.*?\n  \}, \[\]\);\n', '', content, flags=re.DOTALL)
    content = re.sub(r'  // Scroll reveals\n  const revealRefs = useRef\(\[\]\);\n.*?\n  \}, \[\]\);\n', '', content, flags=re.DOTALL)
    # Remove addToRefs
    content = re.sub(r'  const addToRefs = \(arr\) => \(el\) => \{\n    if \(el && !arr.current.includes\(el\)\) \{\n      arr.current.push\(el\);\n    \}\n  \};\n', '', content)
    
    # 4. Replace count numbers
    content = re.sub(
        r'<div className="vital-num" data-count="(\d+)"[^>]*>0</div>',
        r'<div className="vital-num"><AnimatedCounter from={0} to={\1} /></div>',
        content
    )
    content = re.sub(
        r'<div className="vital-num" data-count="(\d+)" data-suffix="([^"]+)"[^>]*>0</div>',
        r'<div className="vital-num"><AnimatedCounter from={0} to={\1} suffix="\2" /></div>',
        content
    )
    content = re.sub(
        r'<div className="stat-num" data-count="(\d+)" data-suffix="([^"]+)"[^>]*>0</div>',
        r'<div className="stat-num"><AnimatedCounter from={0} to={\1} suffix="\2" /></div>',
        content
    )
    content = re.sub(
        r'<div className="stat-num" data-count="(\d+)"[^>]*>0</div>',
        r'<div className="stat-num"><AnimatedCounter from={0} to={\1} /></div>',
        content
    )

    # 5. Inject Hero Image in hero-grid
    hero_image_html = """
              <div className="preview-stack">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.2 }} className="hero-graphic-wrap">
                  <img src="/hero-abstract.jpg" alt="Premium Healthcare Graphic" className="hero-graphic" />
                  <div className="glass-panel">
                    <div className="dot-row"><span className="dot g"></span><span className="dot a"></span><span className="dot r"></span></div>
                    <div className="preview-title" style={{marginTop: '12px', fontSize: '16px'}}>Live System Active</div>
                    <div className="bar-track" style={{marginTop: '12px'}}><div className="bar-fill" style={{ width: '82%' }}></div></div>
                  </div>
                </motion.div>
              </div>
    """
    # Replace the old preview-stack with the new image + glass panel
    content = re.sub(r'<div className="preview-stack">.*?</div>\n            </div>', hero_image_html.strip() + '\n            </div>', content, flags=re.DOTALL)

    # 6. Framer motion wraps for sections
    content = content.replace('<section className="hero reveal is-visible" style={{ paddingTop: \'56px\' }} ref={addToRefs(revealRefs)}>', 
                              '<motion.section initial={{opacity: 0, y: 30}} animate={{opacity: 1, y: 0}} transition={{duration: 0.8}} className="hero" style={{ paddingTop: \'56px\' }}>')
    content = content.replace('</section>', '</motion.section>', 1)
    
    # 7. Update testimonials to include avatars & stars
    testimonial_1 = """<motion.div initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{duration:0.5}} className="t-card card-lift">
                <div className="t-stars">★★★★★</div>
                <p>"{translateUiText("TeleCare+ helped our nurses prioritize risk while keeping family members informed.")}"</p>
                <div className="t-author">
                  <div className="t-avatar bg-blue">DS</div>
                  <div>
                    <div className="t-name">{translateUiText("Dr. Meera Shah")}</div>
                    <div className="t-role">{translateUiText("Clinical Director")}</div>
                  </div>
                </div>
              </motion.div>"""
              
    testimonial_2 = """<motion.div initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{duration:0.6}} className="t-card card-lift">
                <div className="t-stars">★★★★★</div>
                <p>"{translateUiText("The recovery dashboard made daily medicines and follow-ups feel manageable.")}"</p>
                <div className="t-author">
                  <div className="t-avatar bg-mint">AR</div>
                  <div>
                    <div className="t-name">{translateUiText("Anita R.")}</div>
                    <div className="t-role">{translateUiText("Patient")}</div>
                  </div>
                </div>
              </motion.div>"""
              
    testimonial_3 = """<motion.div initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{duration:0.7}} className="t-card card-lift">
                <div className="t-stars">★★★★★</div>
                <p>"{translateUiText("We cut missed follow-ups because the care timeline is visible to everyone.")}"</p>
                <div className="t-author">
                  <div className="t-avatar bg-rose">RC</div>
                  <div>
                    <div className="t-name">{translateUiText("Rural Care Network")}</div>
                    <div className="t-role">{translateUiText("Partner hospital")}</div>
                  </div>
                </div>
              </motion.div>"""
              
    content = re.sub(r'<div className="t-card card-lift reveal"[^>]*>.*?</div>\s*</div>\s*</div>\s*</section>',
                     f'{testimonial_1}\n              {testimonial_2}\n              {testimonial_3}\n            </div>\n          </div>\n        </section>', content, flags=re.DOTALL)

    # 8. Refactor simple reveal divs
    # E.g. <div className="section-head reveal" ref={addToRefs(revealRefs)}>
    content = re.sub(
        r'<div className="([^"]+) reveal" ref=\{addToRefs\(revealRefs\)\}>',
        r'<motion.div initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} transition={{duration: 0.6}} className="\1">',
        content
    )
    
    # 9. Refactor cards that had card-lift reveal
    content = re.sub(
        r'<div className="([^"]+) card-lift reveal" ref=\{addToRefs\(revealRefs\)\}(.*?)>',
        r'<motion.div initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} transition={{duration: 0.5}} whileHover={{ y: -6 }} className="\1 card-lift"\2>',
        content
    )

    # 10. Close motion.div where necessary
    # Instead of regex for closing tags, we just leave them as </div>. 
    # WAIT! In React, <motion.div> must be closed with </motion.div>. If we change the open tag, we MUST change the closing tag.
    # So replacing with <motion.div> via regex without balancing is a syntax error!
    # I MUST parse it properly or use a simpler approach.
    pass

    with open("frontend/src/pages/LandingPage_temp.jsx", "w", encoding="utf-8") as f:
        f.write(content)

main()
