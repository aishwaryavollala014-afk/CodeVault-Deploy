export default function Home() {
  return (
    <>



<header className="nav">
  <div className="wrap nav-in">
    <a className="brand"><span className="mark">CV</span> CodeVault</a>
    <nav className="nav-links" id="navLinks">
      <a href="#problem">Problem</a>
      <a href="#dashboard">Dashboard</a>
      <a href="#sync">GitHub Sync</a>
      <a href="#profile">Profile</a>
      <a href="#faq">FAQ</a>
    </nav>
    <div className="nav-right">
      <a className="btn btn-ghost" href="/login">Sign in</a>
      <a className="btn btn-primary" href="/login">Connect Accounts</a>
      <button className="menu-btn" type="button" id="menuBtn" aria-label="Toggle menu" aria-expanded="false" aria-controls="navLinks"><span></span></button>
    </div>
  </div>
</header>


<section className="hero">
  <div className="wrap">
    <span className="eyebrow"><span className="dot"></span> For competitive programmers</span>
    <h1>You've solved 1,000+ problems.<br/><span className="dim">Nothing online proves it.</span></h1>
    <p className="sub">CodeVault pulls your stats from LeetCode, Codeforces, CodeChef and HackerRank into one dashboard — and pushes every accepted solution to GitHub, organized by problem number.</p>
    <div className="cta">
      <a className="btn btn-primary" href="/login">Connect Accounts</a>
      <a className="btn btn-secondary" href="#dashboard">View live demo</a>
    </div>
    <div className="note">
      <span><span className="tick">✓</span> No browser extension</span>
      <span><span className="tick">✓</span> Your code stays private to you</span>
      <span><span className="tick">✓</span> Free to start</span>
    </div>
    <div className="hero-plats" aria-label="Supported platforms">
      <span className="hp"><span className="hpb lc">LC</span> LeetCode</span>
      <span className="hp"><span className="hpb cf">CF</span> Codeforces</span>
      <span className="hp"><span className="hpb cc">CC</span> CodeChef</span>
      <span className="hp"><span className="hpb hr">HR</span> HackerRank</span>
      <span className="hp more">+ more soon</span>
    </div>

    
    <div className="window">
      <div className="win-bar">
        <div className="win-dots"><i></i><i></i><i></i></div>
        <div className="win-url">app.codevault.dev/dashboard</div>
      </div>
      <div className="win-body">
        <div className="dash">
          <div className="card span2">
            <div className="ch">Problems solved <span className="tag">all platforms</span></div>
            <div className="big-num">1,248</div>
            <div className="delta">+37 this week · 47-day streak</div>
            <div style={{ marginTop: '16px' }} className="pf">
              <div className="pf-row"><span className="lab"><span className="badge-ic lc">LC</span>LeetCode</span><span className="pf-bar"><i className="lc" style={{ width: '100%' }}></i></span><span className="val">612</span></div>
              <div className="pf-row"><span className="lab"><span className="badge-ic cf">CF</span>Codeforces</span><span className="pf-bar"><i className="cf" style={{ width: '56%' }}></i></span><span className="val">341</span></div>
              <div className="pf-row"><span className="lab"><span className="badge-ic cc">CC</span>CodeChef</span><span className="pf-bar"><i className="cc" style={{ width: '30%' }}></i></span><span className="val">184</span></div>
              <div className="pf-row"><span className="lab"><span className="badge-ic hr">HR</span>HackerRank</span><span className="pf-bar"><i className="hr" style={{ width: '18%' }}></i></span><span className="val">111</span></div>
            </div>
          </div>
          <div className="card">
            <div className="ch">Difficulty</div>
            <div className="diff" style={{ flexDirection: 'column', gap: '8px' }}>
              <div className="d easy"><div className="n">540</div><div className="l">Easy</div></div>
              <div className="d med"><div className="n">560</div><div className="l">Medium</div></div>
              <div className="d hard"><div className="n">148</div><div className="l">Hard</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>


<section id="problem">
  <div className="wrap">
    <div className="center lede">
      <span className="eyebrow sec-eyebrow">The problem</span>
      <h2 className="title">Your practice is everywhere. Your proof of work is nowhere.</h2>
      <p className="sec-sub">You grind problems for months. Then someone asks "what have you built?" and you've got four profiles, no code, and a number nobody can verify.</p>
    </div>
    <div className="prob-grid">
      <div className="prob">
        <div className="pc">// four tabs, four numbers</div>
        <h3>Progress lives in four different tabs</h3>
        <p>LeetCode has one count, Codeforces has a rating, CodeChef has stars, HackerRank has badges. There's no single place that says how much you've actually done.</p>
      </div>
      <div className="prob">
        <div className="pc">// git log --oneline → (empty)</div>
        <h3>Your GitHub doesn't show any of it</h3>
        <p>You've spent weeks on DP and graphs, but your contribution graph is grey. The work you're proudest of leaves no trace where people actually look.</p>
      </div>
      <div className="prob">
        <div className="pc">// "trust me, I solved 800"</div>
        <h3>Recruiters can't verify your problem-solving</h3>
        <p>A LeetCode profile rarely makes it onto a resume, and "solved 800 problems" is just a claim until someone can open the solutions and see how you think.</p>
      </div>
      <div className="prob">
        <div className="pc">// 3 years of effort, 0 artifacts</div>
        <h3>Years of effort, nothing to point to</h3>
        <p>When it's time to show your work — for a job, an internship, or just to look back — there's no single thing you can link that represents all of it.</p>
      </div>
    </div>
  </div>
</section>


<section id="solution" style={{ background: 'var(--subtle)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
  <div className="wrap">
    <div className="center lede">
      <span className="eyebrow sec-eyebrow">How CodeVault solves it</span>
      <h2 className="title">Connect once. Everything else is automatic.</h2>
      <p className="sec-sub">You keep solving problems the way you already do. CodeVault turns that effort into a dashboard you can read and a repo you can share.</p>
    </div>
    <div className="sol-grid">
      <div className="sol"><div className="si">01</div><h3>Connect your profiles</h3><p>Add your handles for LeetCode, Codeforces, CodeChef and HackerRank. Stats start showing immediately.</p></div>
      <div className="sol"><div className="si">02</div><h3>Stats stay current on their own</h3><p>CodeVault keeps your counts, ratings and solved lists in sync — you never update a spreadsheet again.</p></div>
      <div className="sol"><div className="si">03</div><h3>One set of analytics</h3><p>See your real totals across every platform: difficulty mix, topic strengths, streaks, and a single submission heatmap.</p></div>
      <div className="sol"><div className="si">04</div><h3>Solutions land in GitHub</h3><p>Every accepted submission is committed to your repo, organized by problem number, with the question and your code.</p></div>
      <div className="sol"><div className="si">05</div><h3>A profile you can send</h3><p>Get one public link that shows your whole coding journey — ready to drop into a resume or a recruiter chat.</p></div>
      <div className="sol"><div className="si">06</div><h3>You stay in control</h3><p>Disconnect any platform anytime. Your code is only ever your own, accessed with your permission.</p></div>
    </div>
  </div>
</section>


<section id="dashboard">
  <div className="wrap">
    <div className="center lede">
      <span className="eyebrow sec-eyebrow">The dashboard</span>
      <h2 className="title">Everything you've solved, in one screen</h2>
      <p className="sec-sub">An example dashboard with realistic, self-consistent numbers — the view you'd open every day.</p>
    </div>

    <div className="window">
      <div className="win-bar">
        <div className="win-dots"><i></i><i></i><i></i></div>
        <div className="win-url">app.codevault.dev/dashboard</div>
      </div>
      <div className="win-body">
        <div className="dash">
          
          <div className="card">
            <div className="ch">Total solved</div>
            <div className="big-num">1,248</div>
            <div className="delta">+37 this week</div>
          </div>
          
          <div className="card">
            <div className="ch">Streak</div>
            <div className="streak">
              <div className="s"><div className="n"><span className="fire">🔥</span> 47</div><div className="l">Current days</div></div>
              <div className="s"><div className="n">89</div><div className="l">Longest</div></div>
            </div>
          </div>
          
          <div className="card">
            <div className="ch">Difficulty</div>
            <div className="diff">
              <div className="d easy"><div className="n">540</div><div className="l">Easy</div></div>
              <div className="d med"><div className="n">560</div><div className="l">Med</div></div>
              <div className="d hard"><div className="n">148</div><div className="l">Hard</div></div>
            </div>
          </div>

          
          <div className="card span2">
            <div className="ch">Platform breakdown</div>
            <div className="pf">
              <div className="pf-row"><span className="lab"><span className="badge-ic lc">LC</span>LeetCode</span><span className="pf-bar"><i className="lc" style={{ width: '100%' }}></i></span><span className="val">612</span></div>
              <div className="pf-row"><span className="lab"><span className="badge-ic cf">CF</span>Codeforces</span><span className="pf-bar"><i className="cf" style={{ width: '56%' }}></i></span><span className="val">341</span></div>
              <div className="pf-row"><span className="lab"><span className="badge-ic cc">CC</span>CodeChef</span><span className="pf-bar"><i className="cc" style={{ width: '30%' }}></i></span><span className="val">184</span></div>
              <div className="pf-row"><span className="lab"><span className="badge-ic hr">HR</span>HackerRank</span><span className="pf-bar"><i className="hr" style={{ width: '18%' }}></i></span><span className="val">111</span></div>
            </div>
          </div>
          
          <div className="card">
            <div className="ch">Topic strengths</div>
            <div className="chips">
              <span className="chip">Arrays <b>210</b></span>
              <span className="chip">DP <b>142</b></span>
              <span className="chip">Graphs <b>118</b></span>
              <span className="chip">Trees <b>96</b></span>
              <span className="chip">Greedy <b>84</b></span>
              <span className="chip">Binary Search <b>71</b></span>
            </div>
          </div>

          
          <div className="card span2">
            <div className="ch">Submission activity <span className="tag">last 12 months</span></div>
            <div className="heat" id="heat" role="img" aria-label="Submission activity heatmap (last 12 months)" aria-hidden="true"></div>
            <div className="heat-legend">Less <i style={{ background: '#efe7df' }}></i><i style={{ background: '#fbd6c6' }}></i><i style={{ background: '#f5a888' }}></i><i style={{ background: '#f0764f' }}></i><i style={{ background: '#d8431f' }}></i> More</div>
          </div>
          
          <div className="card">
            <div className="ch">Recent activity</div>
            <div className="act">
              <div className="act-row"><span className="ic lc"></span><span className="t"><div className="n">Plus One Linked List</div><div className="m">LeetCode 369 · 2h ago</div></span><span className="pill-d med">Med</span></div>
              <div className="act-row"><span className="ic hr"></span><span className="t"><div className="n">Dijkstra: Shortest Reach</div><div className="m">HackerRank · 5h ago</div></span><span className="pill-d hard">Hard</span></div>
              <div className="act-row"><span className="ic cf"></span><span className="t"><div className="n">Edu Round 168 — C</div><div className="m">Codeforces · 1d ago</div></span><span className="pill-d rate">1400</span></div>
              <div className="act-row"><span className="ic cc"></span><span className="t"><div className="n">Chef and Subarrays</div><div className="m">CodeChef · 1d ago</div></span><span className="pill-d easy">Easy</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>


<section id="sync" style={{ background: 'var(--subtle)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
  <div className="wrap">
    <div className="center lede">
      <span className="eyebrow sec-eyebrow">GitHub sync</span>
      <h2 className="title">Solve it once. It's in your repo.</h2>
      <p className="sec-sub">The moment a submission is accepted, CodeVault detects it and commits it — no manual copy-paste.</p>
    </div>

    <div className="flow">
      <div className="step"><div className="k">step 1</div><div className="v">Solve LeetCode 369</div><div className="arrow">→</div></div>
      <div className="step"><div className="k">step 2</div><div className="v"><span className="ok">●</span> Accepted</div><div className="arrow">→</div></div>
      <div className="step"><div className="k">step 3</div><div className="v">CodeVault detects it</div><div className="arrow">→</div></div>
      <div className="step"><div className="k">step 4</div><div className="v"><span className="ok">✓</span> GitHub updated</div></div>
    </div>

    <div className="repo-wrap">
      <div className="repo">
        <div><span className="fld">LeetCodeQuestions/</span></div>
        <div>├── <span className="cmt">README.md</span></div>
        <div>├── <span className="fld">0369/</span></div>
        <div>│&nbsp;&nbsp;├── <span className="q">question.md</span></div>
        <div>│&nbsp;&nbsp;└── <span className="s">solution.py</span></div>
        <div>└── <span className="fld">0704/</span></div>
        <div>&nbsp;&nbsp;&nbsp;├── <span className="q">question.md</span></div>
        <div>&nbsp;&nbsp;&nbsp;└── <span className="s">solution.cpp</span></div>
      </div>
      <div className="repo-note">
        <h3>Organized so people can actually read it</h3>
        <ul>
          <li><span className="tick">✓</span> One folder per problem, named by its number — sorts naturally.</li>
          <li><span className="tick">✓</span> <span className="mono">question.md</span> holds the statement, difficulty, tags and link.</li>
          <li><span className="tick">✓</span> <span className="mono">solution.&lt;ext&gt;</span> is your accepted code, in the language you used.</li>
          <li><span className="tick">✓</span> A top-level README indexes every problem you've solved.</li>
        </ul>
      </div>
    </div>
  </div>
</section>


<section id="profile">
  <div className="wrap">
    <div className="center lede">
      <span className="eyebrow sec-eyebrow">Public profile</span>
      <h2 className="title">One link. Your entire coding journey.</h2>
      <p className="sec-sub">Send it to a recruiter, put it on your resume, pin it in your bio. It works across every platform you've connected.</p>
    </div>

    <div className="profile-card">
      <div className="pc-top">
        <div className="pc-av">G</div>
        <div className="pc-id">
          <div className="nm">Gaurav Teegulla</div>
          <div className="ln">codevault.dev/u/gaurav</div>
        </div>
        <button className="btn btn-secondary pc-link" id="copyBtn">Copy link</button>
      </div>
      <div className="pc-stats">
        <div className="st"><div className="n">1,248</div><div className="l">Solved</div></div>
        <div className="st"><div className="n">4</div><div className="l">Platforms</div></div>
        <div className="st"><div className="n">148</div><div className="l">Hard</div></div>
        <div className="st"><div className="n">89</div><div className="l">Best streak</div></div>
      </div>
    </div>
    <p className="center muted" style={{ marginTop: '18px', fontSize: '14px' }}>Recruiter-friendly, portfolio-ready, and always up to date.</p>
  </div>
</section>


<section id="how" style={{ background: 'var(--subtle)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
  <div className="wrap">
    <div className="center lede">
      <span className="eyebrow sec-eyebrow">How it works</span>
      <h2 className="title">Three steps, then you forget it exists</h2>
    </div>
    <div className="how">
      <div className="h"><div className="n">1</div><h3>Add your usernames</h3><p>Paste your handles. Public stats appear right away — no authorization needed just to see your numbers.</p></div>
      <div className="h"><div className="n">2</div><h3>Authorize sync once</h3><p>Grant access a single time so CodeVault can read your own accepted submissions and push them to GitHub.</p></div>
      <div className="h"><div className="n">3</div><h3>Keep solving</h3><p>Every accepted problem updates your dashboard and lands in your repo automatically. Nothing else to do.</p></div>
    </div>
  </div>
</section>


<section id="founder">
  <div className="wrap">
    <div className="center lede">
      <span className="eyebrow sec-eyebrow">Why I built this</span>
      <h2 className="title">I got tired of having nothing to show</h2>
    </div>
    <div className="founder">
      <p>I'd been solving problems for years — LeetCode at night, the odd Codeforces round on weekends, CodeChef long challenges, HackerRank for interview prep. The progress was real, but it was scattered across four accounts.</p>
      <p>When I went to put it on a resume, I realized I had nothing concrete. My GitHub didn't reflect any of it. "I've solved a lot of problems" isn't something you can link to. The work existed; the proof didn't.</p>
      <p>So I built CodeVault for myself first: one dashboard to see everything, and a GitHub repo that fills itself in as I solve. If you've felt the same gap between effort and evidence, it's for you too.</p>
      <div className="sig">
        <div className="av">G</div>
        <div className="who"><b>Gaurav Teegulla</b><span>Building CodeVault</span></div>
      </div>
    </div>
  </div>
</section>


<section id="faq" style={{ background: 'var(--subtle)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
  <div className="wrap">
    <div className="center lede">
      <span className="eyebrow sec-eyebrow">FAQ</span>
      <h2 className="title">Questions, answered plainly</h2>
    </div>
    <div className="faq" id="faqList">
      <div className="qa"><button>How does the GitHub sync work?<span className="pm">+</span></button><div className="ans"><p>CodeVault checks your connected accounts for newly accepted submissions, fetches the code and problem statement, then commits a folder named by the problem number to your repo via the GitHub API.</p></div></div>
      <div className="qa"><button>Is my code private?<span className="pm">+</span></button><div className="ans"><p>Your solution code is only accessed for your own account, with your authorization, and pushed to a repo you own. You decide if that repo is public or private.</p></div></div>
      <div className="qa"><button>Why is authorization needed?<span className="pm">+</span></button><div className="ans"><p>Submitted source code is private on every platform — a username alone can't reach it. A one-time authorized connection lets CodeVault read only your own submissions.</p></div></div>
      <div className="qa"><button>Which platforms are supported?<span className="pm">+</span></button><div className="ans"><p>LeetCode, Codeforces, CodeChef and HackerRank at launch. More platforms are planned, and each new one is added as a single integration.</p></div></div>
      <div className="qa"><button>Can I disconnect accounts?<span className="pm">+</span></button><div className="ans"><p>Yes, anytime, from your settings. Disconnecting stops all future syncing for that platform immediately.</p></div></div>
      <div className="qa"><button>Is the dashboard public?<span className="pm">+</span></button><div className="ans"><p>Your full dashboard is private to you. You can optionally enable a public profile at <span className="mono">/u/your-name</span> that shows aggregated stats only.</p></div></div>
      <div className="qa"><button>How often does sync happen?<span className="pm">+</span></button><div className="ans"><p>Sync runs on a schedule (a few times a day) and can be triggered manually. Stats refresh from public data; code syncs when a session is authorized and valid.</p></div></div>
    </div>
  </div>
</section>


<section id="cta">
  <div className="wrap">
    <div className="final">
      <h2>Turn the problems you solve into proof</h2>
      <p>Connect your accounts and let your dashboard and GitHub fill themselves in.</p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <a className="btn btn-primary" href="/login">Connect Accounts</a>
        <a className="btn btn-secondary" href="#dashboard">View live demo</a>
      </div>
    </div>
  </div>
</section>


<footer>
  <div className="wrap">
    <div className="foot">
      <div className="col about">
        <a className="brand"><span className="mark">CV</span> CodeVault</a>
        <p>One dashboard for your competitive programming, automatically synced to GitHub.</p>
      </div>
      <div className="col"><h4>Product</h4><a href="#dashboard">Dashboard</a><a href="#sync">GitHub Sync</a><a href="#profile">Public Profile</a><a href="#how">How it works</a></div>
      <div className="col"><h4>Platforms</h4><a href="#">LeetCode</a><a href="#">Codeforces</a><a href="#">CodeChef</a><a href="#">HackerRank</a></div>
      <div className="col"><h4>Company</h4><a href="#founder">About</a><a href="#faq">FAQ</a><a href="#">Privacy</a><a href="#">Contact</a></div>
    </div>
    <div className="foot-bottom">
      <span>© 2026 CodeVault</span>
      <span>Sample landing page · built for developers</span>
    </div>
  </div>
</footer>



    </>
  );
}
