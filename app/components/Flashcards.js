import React from 'react';
import update from 'immutability-helper';
import { EditorKit, EditorKitDelegate } from 'sn-editor-kit';

import ConfirmDialog from './ConfirmDialog';
import DataErrorAlert from './DataErrorAlert';
import EditCard from './EditCard';

import ViewMode from './ViewMode';
import StudyMode from './StudyMode';
import Table from './Table';

const initialState = {
  text: '',
  entries: [],
  parseError: false,
  confirmRemove: false,
  confirmRestart: false,
  editEntry: null,
  editCardMode: false,
  flip: false,
  show: false,
  studyFlip: false,
  studyShow: false,
  randomCardList: [], //list of IDs for random study mode
  randomCardID: 0, // the ID of the study card (which is not necessarily its corresponding index in the study card list)
  spacedCardList: [], //list of IDs for random study mode
  spacedCardID: 0, // the ID of the study card (which is not necessarily its corresponding index in the study card list)
  viewMode: true,
  tableMode: false,
};

let keyMap = new Map();

export default class Flashcards extends React.Component {
  constructor(props) {
    super(props);
    this.configureEditorKit();
    this.state = initialState;
  }

  configureEditorKit() {
    let delegate = new EditorKitDelegate({
      setEditorRawText: text => {
        let parseError = false;
        let entries = [];

        if (text) {
          try {
            entries = JSON.parse(text);
          } catch (e) {
            // Couldn't parse the content
            parseError = true;
            this.setState({
              parseError: true
            });
          }
        }

        this.setState({
          ...initialState,
          text,
          parseError,
          entries
        });
      },
      generateCustomPreview: text => {
        let entries = [];
        try {
          entries = JSON.parse(text);
        } finally {
          return {
            html: `<div><strong>${entries.length}</strong> Flashcards </div>`,
            plain: `${entries.length} Flashcards`,
          };
        }
      },
      clearUndoHistory: () => {},
      getElementsBySelector: () => []
    });

    this.editorKit = new EditorKit({
      delegate: delegate,
      mode: 'json',
      supportsFilesafe: false
    });
  }

  saveNote(entries) {
    this.editorKit.onEditorValueChanged(JSON.stringify(entries, null, 2));
  }

  /*cardsList = () => {
    let cardsList = this.state.entries.filter(entry => this.state.entries.indexOf(entry) > 0);
    this.setState({
      studyCards: cardsList
    })
  }*/

  // Entry operations
  addEntry = entry => {
    this.setState(state => {
      const entries = state.entries.concat([entry]);
      this.saveNote(entries);
      console.log("finished adding entry")
      return {
        editCardMode: false,
        editEntry: null,
        entries
      };
    });
  };

  editEntry = ({ id, entry }) => {
    this.setState(state => {
      const entries = update(state.entries, { [id]: { $set: entry } });
      this.saveNote(entries);
      console.log("finished editing entry");
      return {
        editCardMode: false,
        editEntry: null,
        entries
      };
    });
  };

  removeEntry = id => {
    this.setState(state => {
      const entries = update(state.entries, { $splice: [[id, 1]] });
      this.saveNote(entries);

      return {
        confirmRemove: false,
        editEntry: null,
        entries
      };
    });
  };

  // Event Handlers
  onAddNew = () => {
    this.setState({
      editCardMode: !this.state.editCardMode,
      editEntry: null
    });
  };

  onEdit = id => {
    this.setState(state => ({
      editCardMode: true,
      editEntry: {
        id,
        entry: state.entries[id]
      }
    }));
  };

  onCancel = () => {
    this.setState({
      confirmRemove: false,
      editCardMode: false,
      editEntry: null
    });
  };

  onRemove = id => {
    this.setState(state => ({
      confirmRemove: true,
      editEntry: {
        id,
        entry: state.entries[id]
      }
    }));
  };

  onSave = ({ id, entry }) => {
    // If there's no ID it's a new note
    if (id != null) {
      this.editEntry({ id, entry });
    } else {
      this.addEntry(entry);
    }
  };

  onFlip = () => {
    this.setState({
      flip: !this.state.flip,
      tableMode: false,
      studyFlip: false,
      studyShow: false,
      viewMode: true,
      editCardMode: false,
      editEntry: null
    });
  };

  onShow = () => {
    this.setState({
      show: !this.state.show,
      tableMode: false,
      studyFlip: false,
      studyShow: false,
      viewMode: true,
      editCardMode: false,
      editEntry: null
    });
  };

  onHide = () => {
    this.setState({
      show: false,
      tableMode: false,
      studyFlip: false,
      studyShow: false,
      viewMode: true,
      editCardMode: false,
      editEntry: null
    });
  };

  onTableMode = () => {
    this.setState({
      tableMode: !this.state.tableMode,
      show: false,
      studyFlip: false,
      studyShow: false,
      viewMode: false,
      editCardMode: false,
      editEntry: null
    });
  };

  onStudyFlip = () => {
    if (this.state.randomCardList.length === 0 && this.state.entries.length > 0) {
      this.getRandomCardList();
    }
    if (this.state.entries.length > 0) {
      // if studyFlip is turned on, then turn it off and turn on viewMode
      if (this.state.studyFlip) {
        this.setState({
          studyFlip: false,
          studyShow: false,
          viewMode: true,
          editCardMode: false,
          editEntry: null
        });
      }
      // if studyFlip is turned off, then turn it on and turn off viewMode
      else if (!this.state.studyFlip) {
        this.setState({
          tableMode: false,
          studyFlip: true,
          studyShow: false,
          viewMode: false,
          editCardMode: false,
          editEntry: null
        });
      }
    }
  };

  onStudyShow = () => {
    if (this.state.randomCardList.length === 0 && this.state.entries.length > 0) {
      this.getRandomCardList();
    }
    if (this.state.entries.length > 0) {
      // if studyShow is turned on, then turn it off and turn on viewMode
      if (this.state.studyShow) {
        this.setState({
          studyFlip: false,
          studyShow: false,
          viewMode: true, 
          editCardMode: false,
          editEntry: null
        });
      }
      // if studyShow is turned off, then turn it on and turn off viewMode
      else if (!this.state.studyShow) {
        this.setState({
          studyFlip: false,
          tableMode: false,
          studyShow: true,
          viewMode: false,
          editCardMode: false,
          editEntry: null
        });
      } 
    }
  };

  // shuffle cards with the Fisher-Yates (aka Knuth) Shuffle. See http://bost.ocks.org/mike/shuffle/
  onShuffleCards = () => {
    var currentIndex = this.state.entries.length, temporaryValue, randomIndex;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = this.state.entries[currentIndex];
      this.state.entries[currentIndex] = this.state.entries[randomIndex];
      this.state.entries[randomIndex] = temporaryValue;
      this.editEntry({ randomIndex, temporaryValue });
    };
  }

  // this isn't working!!!
  getRandomCardList = () => {
    if (this.state.entries != 0) {
      var temporaryList = [];
      for (var i = 0; i < this.state.entries.length; i++){
        temporaryList.push(i); 
      }
      //this.onShow();
      
      //var temporaryList = Array.from(Array(this.state.entries.length - 1).keys())
      var currentIndex = temporaryList.length, temporaryValue, randomIndex;
      
      // While there remain elements to shuffle...
      while (0 !== currentIndex) {
    
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
    
        // And swap it with the current element.
        temporaryValue = temporaryList[currentIndex];
        temporaryList[currentIndex] = temporaryList[randomIndex];
        temporaryList[randomIndex] = temporaryValue;
      };
      const firstID = Number(temporaryList[0]);
      this.setState({
        randomCardList: temporaryList,
        randomCardID: firstID,
      });
    }
  }

  // this is the basic version, without randomness
  onNextCardOld = () => {
    //const newIDCounter = this.state.randomCardID + 1
    // the last ID should be one less than the length because IDs start at zero
    // if the id is one less than the length, then start over with a randomized list
    if (this.state.randomCardID === this.state.entries.length - 1 ) { 
      //const newID = this.randomCardList[0]
      //const temporaryList = this.getRandomCardList; // which is equal to this.state.randomCardList
      //const randomNewID = this.state.randomCardList[0]
      const newID = 0;
      this.setState({
        randomCardID: newID,
        confirmRestart: true,
      });
    }
    //otherwise, add one add one and continue
    else {
      const newID = this.state.randomCardID + 1;
      //const newID = this.state.randomCardList[newIDCounter]
      this.setState({
        randomCardID: newID,
      });
    }
    //this.onShow();
  }
  
  onNextCard = () => {
    // the last ID is the 
    //if (this.state.randomCardID == this.state.entries.length - 1 ) {
    const currentIndex = this.state.randomCardList.indexOf(this.state.randomCardID);
    const lastIndex = this.state.randomCardList.length - 1; // last index of randomCardList
    if (currentIndex === lastIndex) {
      this.getRandomCardList();
      this.setState({
        confirmRestart: true // if all cards studied, ask if you want to start over
      });
    }
    
    //otherwise, add one add one and continue
    else {
      const nextIndex = currentIndex + 1;
      const nextCardID = this.state.randomCardList[nextIndex];
      this.setState({
        randomCardID: nextCardID,
      });
    }
  }

  onStudyMore = () => {
    this.setState({
      confirmRestart: false,
    });
  }

  onStopStudy = () => {
    this.onHide();
    this.setState({
      confirmRestart: false,
    });
  }

  // check if each card is hidden or shown (doesn't work yet)
  checkHideMode = () => {
    if (this.state.show) {
      state.entries.forEach((entry) => 
        {return true})
    }
  }

  /*
  <div>{this.state.randomCardList}<br></br><br></br>
  <br></br>zero: {this.state.randomCardList[0]}, one: {this.state.randomCardList[1]}, two: {this.state.randomCardList[2]}, three: {this.state.randomCardList[3]}<br></br>
  <br></br>studyCard: {this.state.randomCardList[this.state.randomCardID]}
  <br></br>randomCardID: {this.state.randomCardID}
  <br></br>next card: {this.state.randomCardList[this.state.randomCardID + 1]}
  <br></br>next id: {this.state.randomCardID + 1}
  </div>
  */

  // Need both content and appendix for mobile
  scrollToBottom = () => {
    var content = document.getElementById("content");
    var appendix = document.getElementById("appendix");
    document.body.scrollTop = 10000000; // for Safari
    content.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"}); // Bottom
    appendix.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"}); // Bottom
  }

  // Need both content and appendix for mobile
  // Skip to Bottom is fast "auto" behavior instead of "smooth" behavior
  skipToBottom = () => {
    var content = document.getElementById("content");
    var appendix = document.getElementById("appendix");
    document.body.scrollTop = 10000000; // for Safari
    content.scrollIntoView({behavior: "auto", block: "end", inline: "nearest"}); // Bottom
    appendix.scrollIntoView({behavior: "auto", block: "end", inline: "nearest"}); // Bottom
  }

  // Need both content and appendix for mobile
  scrollToTop = () => {
    var content = document.getElementById("content")
    var header = document.getElementById("header");
    document.body.scrollTop = 0; // for Safari
    content.scrollIntoView({behavior: "smooth", block: "start", inline: "nearest"}); // Top
    header.scrollIntoView({behavior: "smooth", block: "start", inline: "nearest"}); // Top
  }

  // Need both content and appendix for mobile
  // Skip to Bottom is fast "auto" behavior instead of "smooth" behavior
  skipToTop = () => {
    var content = document.getElementById("content")
    var header = document.getElementById("header");
    document.body.scrollTop = 0; // for Safari
    content.scrollIntoView({behavior: "auto", block: "start", inline: "nearest"}); // Top
    header.scrollIntoView({behavior: "auto", block: "start", inline: "nearest"}); // Top
  }

  onKeyDown = (e) => {
    keyMap.set(e.key, true);
    if (keyMap.get('Control') && keyMap.get('{')) {
      e.preventDefault();
      this.scrollToTop();
    }
    else if (keyMap.get('Control') && keyMap.get('}')) {
      e.preventDefault();
      this.scrollToBottom();
    }
    else if (keyMap.get('Control') && keyMap.get('[')) {
      e.preventDefault();
      this.skipToTop();
    }
    else if (keyMap.get('Control') && keyMap.get(']')) {
      e.preventDefault();
      this.skipToBottom();
    }
    console.log("")
    // TODO: If you close it with Ctrl + W and open it again, the Ctrl event key isn't set to false
    // So, if you have minimize to tray on, then it'll open with Ctrl still down
  }

  onKeyUp = (e) => {
    keyMap.set(e.key, false);
  }

  render() {
    const editEntry = this.state.editEntry || {};

    //this.getRandomCardList();
    //let cardsList = this.state.entries.filter(entry => this.state.entries.indexOf(entry) > 0);
    return (
      <div tabIndex="0" className="sn-component" onKeyDown={this.onKeyDown} onKeyUp={this.onKeyUp}>
        {this.state.parseError && <DataErrorAlert />}
        <div id="header">
        <div className="sk-button-group">
            <button onClick={this.onStudyFlip} className={"sk-button info " + (this.state.studyFlip ? 'on' : 'off' )}>
              {this.state.entries.length > 0 ? ( // if cardsList is empty, button doesn't do anything
                <div className="sk-label"  > Study Flip </div>
              ) : (
                <div className="sk-label"> Study Flip </div>
              )}
            </button>
            <button onClick={this.onStudyShow} className={"sk-button info " + (this.state.studyShow ? 'on' : 'off' )}>
              {this.state.entries.length > 0 ? ( // if cardsList is empty, button doesn't do anything
                <div className="sk-label"> Study Show </div>
              ) : (
                <div className="sk-label"> Study Show </div>
              )}
            </button>
            <button onClick={this.onFlip} className={"sk-button info " + (this.state.flip ? 'on' : 'off' )}>
              {!this.state.flip && ( // if show mode is false
                <div className="sk-label" >Flip All</div>
              )}
              {this.state.flip && ( // if  show mode is true 
                <div className="sk-label" >Flip Back All</div>
              )}
            </button>
            <button onClick={this.onShow} className={"sk-button info " + (this.state.show ? 'on' : 'off' )}>
              {!this.state.show && ( // if show mode is false
                <div className="sk-label" >Show All</div>
              )}
              {this.state.show && ( // if  show mode is true 
                <div className="sk-label" >Hide All</div>
              )}
            </button>
            <button onClick={this.onAddNew} className={"sk-button info " + (this.state.editCardMode ? 'on' : 'off' )}>
              <div className="sk-label">Add New</div>
            </button>
            <button onClick={this.getRandomCardList} className="sk-button info off" >
              <div className="sk-label">Settings</div>
            </button>
            <button onClick={this.onShuffleCards} className="sk-button info off" >
              <div className="sk-label">Shuffle</div>
            </button>
            <button onClick={this.onTableMode} className={"sk-button info " + (this.state.tableMode ? 'on' : 'off' )}>
              <div className="sk-label">Table</div>
            </button>
          </div>
        </div>

        <div id="content">
         {this.state.tableMode && ([
           <Table
           entries={this.state.entries}/>
         ])}
        {this.state.studyFlip && !this.state.editCardMode && ( // if show mode is on and flip mode is off
            <StudyMode
              id={this.state.randomCardID}
              onNextCard={this.onNextCard}
              flip={this.state.flip}
              show={this.state.show}
              studyFlip={this.state.studyFlip}
              studyShow={this.state.studyShow}
              entries={this.state.entries}
              viewMode={this.state.viewMode}
              onEdit={this.onEdit}
              onRemove={this.onRemove}
            />
          )}
          {this.state.studyShow && !this.state.editCardMode && ( // if show mode is on and flip mode is off
            <StudyMode
              id={this.state.randomCardID}
              onNextCard={this.onNextCard}
              flip={this.state.flip}
              show={this.state.show}
              studyFlip={this.state.studyFlip}
              studyShow={this.state.studyShow}
              entries={this.state.entries}
              viewMode={this.state.viewMode}
              onEdit={this.onEdit}
              onRemove={this.onRemove}
            />
          )}
          {this.state.show && !this.state.flip && !this.state.editCardMode && this.state.viewMode && ( // if show mode is on and flip mode is off
            <ViewMode
              flip={this.state.flip}
              show={this.state.show}
              studyFlip={this.state.studyFlip}
              studyShow={this.state.studyShow}
              entries={this.state.entries}
              viewMode={this.state.viewMode}
              onEdit={this.onEdit}
              onRemove={this.onRemove}
            />
          )}
          {this.state.show && this.state.flip && !this.state.editCardMode && this.state.viewMode &&( // if show mode is on and flip mode is on
            <ViewMode
              flip={this.state.flip}
              show={this.state.show}
              studyFlip={this.state.studyFlip}
              studyShow={this.state.studyShow}
              entries={this.state.entries}
              viewMode={this.state.viewMode}
              onEdit={this.onEdit}
              onRemove={this.onRemove}
            />
          )}
          {!this.state.show && !this.state.flip && !this.state.editCardMode && this.state.viewMode &&( // if show mode is off and flip mode is off
            <ViewMode
              flip={this.state.flip}
              show={this.state.show}
              studyFlip={this.state.studyFlip}
              studyShow={this.state.studyShow}
              entries={this.state.entries}
              viewMode={this.state.viewMode}
              onEdit={this.onEdit}
              onRemove={this.onRemove}
            />
          )}
          {!this.state.show && this.state.flip && !this.state.editCardMode && this.state.viewMode &&( // if show mode is off and flip mode is on 
            <ViewMode
              flip={this.state.flip}
              show={this.state.show}
              studyFlip={this.state.studyFlip}
              studyShow={this.state.studyShow}
              entries={this.state.entries}
              viewMode={this.state.viewMode}
              onEdit={this.onEdit}
              onRemove={this.onRemove}
            />
          )}
          {this.state.editCardMode && (
            <EditCard
              id={editEntry.id}
              entry={editEntry.entry}
              onSave={this.onSave}
              onCancel={this.onCancel}
            />
          )}
          {this.state.confirmRemove && (
            <ConfirmDialog
              title={`Remove ${editEntry.entry.side1}`}
              message="Are you sure you want to remove this card?"
              onConfirm={() => this.removeEntry(editEntry.id)}
              onCancel={this.onCancel}
            />
          )}
          {this.state.confirmRestart && (
            <ConfirmDialog
              title={`You have studied all the cards.`}
              message="Would you like to start over?"
              onConfirm={this.onStudyMore}
              onCancel={this.onStopStudy}
            />
          )}
        </div>
        <div id="appendix" className={ "appendix "  + (this.state.printMode ? 'printModeOn' : 'printModeOff' )}>
          <button type="button" id="scrollToTopButton" onClick={this.scrollToTop} className="sk-button info">
            <div className="sk-label"> ▲ </div>
          </button>
          <button type="button" id="scrollToBottomButton" onClick={this.scrollToBottom} className="sk-button info">
            <div className="sk-label"> ▼ </div>
          </button>
        </div>
      </div>
    );
  }
}
