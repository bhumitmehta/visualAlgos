import {getProblems} from '@/app/problems/data'
import DifficultyPill from '@/helper/DifficultyPill';
import { ProblemConfig } from '@/interfaces/ProblemConfig.interface';
export default async function AdditionalIndex(){
    const problems = await getProblems();

    return (<>
        <section className="py-16" style={{borderTop:"1px solid rgba(255,255,255,0.05)"}}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="h-px w-5 bg-white opacity-20" />
            <span className="text-[10px] uppercase tracking-[0.25em]" style={{color:"rgba(255,255,255,0.3)"}}>Problem index</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1">
            {problems.map((p,i)=>(
              <a key={i} href={`/problems/${p.slug}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg group transition-all"
                style={{background:"transparent"}}
                onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.background="rgba(255,255,255,0.03)";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.background="transparent";}}>
                <span className="text-[9px] font-mono w-5" style={{color:"rgba(255,255,255,0.15)"}}>{String(i+1).padStart(2,"0")}</span>
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{background:p.accent}} />
                <span className="text-xs flex-1 min-w-0 truncate transition-colors group-hover:text-white" style={{color:"rgba(255,255,255,0.45)"}}>
                  {p.title}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[9px] uppercase tracking-widest" style={{color:"rgba(255,255,255,0.2)"}}>
                    ~{p.watchMinutes}m
                  </span>
                  <DifficultyPill diff={p.difficulty} />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>);

}