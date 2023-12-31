// import react hooks
import { useState, useEffect } from 'react';
import supabase from './supabase';
import './style.css';

const CATEGORIES = [
  { name: 'technology', color: '#3b82f6' },
  { name: 'science', color: '#16a34a' },
  { name: 'finance', color: '#ef4444' },
  { name: 'society', color: '#eab308' },
  { name: 'entertainment', color: '#db2777' },
  { name: 'health', color: '#14b8a6' },
  { name: 'history', color: '#f97316' },
  { name: 'news', color: '#8b5cf6' },
];

function App() {
  // state variables to show/hide form, set facts, check if loading, and set category
  const [showForm, setShowForm] = useState(false);
  const [facts, setFacts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCategory, setCurrentCategory] = useState('all');

  // useEffect hook is used to change category of facts displayed
  useEffect(
    // contains function for useEffect hook and dependency array
    // parent function declares 'getFacts()' function, and then calls 'getFacts()'
    // change in dependency array leads to calling parent function

    function () {
      // define function 'getFacts()'

      async function getFacts() {
        // set 'loading' state variable to true, display loading message
        setIsLoading(true);

        // set query for all entries for 'facts' table
        let query = supabase.from('facts').select('*');

        //  if category is not 'all', remove entries from other categories
        if (currentCategory !== 'all')
          query = query.eq('category', currentCategory);

        // get up to 100 entries, in ascending order of 'interesting votes
        const { data: facts, error } = await query
          .order('votesInteresting', { ascending: true })
          .limit(100);

        // if query is successful, update 'facts' state variable
        // if unsuccessful, display popup notification on webpage
        if (!error) setFacts(facts);
        else alert('There was a problem getting data');

        // set 'loading' state variable to false, remove loading message
        setIsLoading(false);
      }

      // call function defined above
      getFacts();
    },

    // dependency array for useEffect hook
    [currentCategory]
  );

  // This part is displayed when the 'App' component is displayed on the browser
  return (
    // We can only return one element from the function
    // <></> is a JSX element called "fragment"
    // It can be used to group multiple elements

    <>
      {/* pass down 'showForm' and 'setShowForm' as props to
      'Header' component and display it at the top of the page */}
      <Header showForm={showForm} setShowForm={setShowForm} />

      {/* if 'showForm' variable is true, display 'NewFactForm' component
      and pass 'setFacts' and 'setShowForm' as props to 'NewFactForm'*/}
      {showForm ? (
        <NewFactForm setFacts={setFacts} setShowForm={setShowForm} />
      ) : null}

      {/* 'main' component is below other components and contains 'CategoryFilter'
      component on the left, and either 'Loader' or 'Factlist' on the right */}

      <main className="main">
        {/* display 'CategoryFilter' with 'setCurrentCategory' as props*/}
        <CategoryFilter setCurrentCategory={setCurrentCategory} />

        {/* if isLoading is true, display 'Loader'
        if false, display 'FactList' with 'facts' and 'setFacts' as props*/}
        {isLoading ? (
          <Loader />
        ) : (
          <FactList facts={facts} setFacts={setFacts} />
        )}
      </main>
    </>
  );
}

// this component displays based on isLoading state variable
function Loader() {
  return <p className="message">Loading...</p>;
}

// Header accepts showForm and setShowForm as props from App
function Header({ showForm, setShowForm }) {
  // Create a message for the top of the page
  const appTitle = 'Facts I Learned';

  // Header component displays this
  return (
    // parent component called 'header'

    <header className="header">
      {/* Displays div with image and heading */}
      <div className="logo">
        <img src="logo.png" alt="Today I Learned Logo" />
        {/* Source for the lightbulb image
        <a
          href="https://www.flaticon.com/free-icons/critical-thinking"
          title="critical thinking icons"
        >
          Critical thinking icons created by bsd - Flaticon
        </a> */}
        <h1>{appTitle}</h1>
      </div>

      {/* Button for opening/closing 'NewFactForm' component */}
      {/* Each button click toggles the boolean value for 'showForm' state variable */}
      <button
        className="btn btn-large btn-open"
        onClick={() => setShowForm((show) => !show)}
      >
        {/* Set text in button based on whether 'NewFactForm' is displayed */}
        {showForm ? '❌ Close' : 'Share a fact'}
      </button>
    </header>
  );
}

// Used in 'NewFactForm' to see if the fact's source is a valid URL
function isValidHttpUrl(string) {
  let url;
  // attempt to convert string to URL, and return false if unsuccessful
  // if URL protocal is valid, return true
  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }
  return url.protocol === 'http:' || url.protocol === 'https:';
}

function NewFactForm({ setFacts, setShowForm }) {
  // state variables for new fact(text, source, category) and to check is fact is uploading
  const [text, setText] = useState('');
  const [source, setSource] = useState('');
  const [category, setCategory] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const textLength = text.length;

  async function handleSubmit(e) {
    // 1. Prevent browser reload
    e.preventDefault();

    // 2. Check if data is valid. If so, create a new fact

    if (text && isValidHttpUrl(source) && category && textLength <= 1000) {
      // 3. Upload fact to Supabase and receive the new fact object

      // disables form to prevent multiple submissions
      setIsUploading(true);
      const { data: newFact, error } = await supabase
        .from('facts')
        .insert([{ text, source, category }])
        .select();
      // reenables form for the user
      setIsUploading(false);

      // 4. Add the new fact to the UI: add the fact to state
      if (!error) setFacts((facts) => [newFact[0], ...facts]);

      // 5. Reset input fields
      setText('');
      setSource('');
      setCategory('');

      // 6. Close the form
      setShowForm(false);
    }
  }

  return (
    <form className="fact-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Share a fact with the world..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isUploading}
      />
      <span>{1000 - textLength}</span>
      <input
        type="text"
        placeholder="Trustworthy source..."
        value={source}
        onChange={(e) => setSource(e.target.value)}
        disabled={isUploading}
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        disabled={isUploading}
      >
        <option value="">Choose category:</option>
        {CATEGORIES.map((cat) => (
          <option key={cat.name} value={cat.name}>
            {cat.name.toUpperCase()}
          </option>
        ))}
      </select>
      <button className="btn btn-large" disabled={isUploading}>
        Post
      </button>
    </form>
  );
}

function CategoryFilter({ setCurrentCategory }) {
  return (
    <aside>
      <ul className="categories">
        <li className="categories-heading">Categories</li>
        <li className="category">
          <button
            className="btn btn-all-categories"
            onClick={() => setCurrentCategory('all')}
          >
            All
          </button>
        </li>
        {CATEGORIES.map((cat) => (
          <li key={cat.name} className="category">
            <button
              className="btn btn-category"
              style={{ backgroundColor: cat.color }}
              onClick={() => setCurrentCategory(cat.name)}
            >
              {cat.name}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function FactList({ facts, setFacts }) {
  if (facts.length === 0) {
    return (
      <p className="message">
        No facts for this category yet! Create the first one ⬆⬆⬆
      </p>
    );
  }

  return (
    <section>
      <ul className="facts-list">
        {facts.map((fact) => (
          <Fact key={fact.id} fact={fact} setFacts={setFacts} />
        ))}
      </ul>
      <p>There are {facts.length} facts in the database. Add your own!</p>
    </section>
  );
}

function Fact({ fact, setFacts }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const isDisputed =
    fact.votesInteresting + fact.votesMindblowing < fact.votesFalse;

  async function handleVote(columnName) {
    setIsUpdating(true);
    const { data: updatedFact, error } = await supabase
      .from('facts')
      .update({ [columnName]: fact[columnName] + 1 })
      .eq('id', fact.id)
      .select();
    setIsUpdating(false);

    if (!error)
      setFacts((facts) =>
        facts.map((f) => (f.id === fact.id ? updatedFact[0] : f))
      );
  }

  return (
    <li className="fact">
      <p>
        {isDisputed ? <span className="disputed">[⛔️ DISPUTED]</span> : null}
        {fact.text}
        <a
          className="source"
          href={fact.source}
          target="_blank"
          rel="noreferrer"
        >
          (Source)
        </a>
      </p>
      <span
        className="tag"
        style={{
          backgroundColor: CATEGORIES.find((cat) => cat.name === fact.category)
            .color,
        }}
      >
        {fact.category}
      </span>
      <div className="vote-buttons">
        <button
          onClick={() => handleVote('votesInteresting')}
          disabled={isUpdating}
        >
          👍 {fact.votesInteresting}
        </button>
        <button
          onClick={() => handleVote('votesMindblowing')}
          disabled={isUpdating}
        >
          🤯 {fact.votesMindblowing}
        </button>
        <button onClick={() => handleVote('votesFalse')} disabled={isUpdating}>
          ⛔️ {fact.votesFalse}
        </button>
      </div>
    </li>
  );
}

// Export 'App' Component to be imported in 'index.js' and displayed in React
export default App;
