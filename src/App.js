import React, { Component } from "react";
import uniqueId from "lodash/uniqueId";
import humanizeDuration from "humanize-duration";
import dayjs from "dayjs";
import 'bootstrap/dist/css/bootstrap.css';
import createAudioMeter from "./methods";
import "./App.css";

const VOLUME_LIMIT = 0.01;
const INTERVAL_WITHOUT_SOUND = 3000;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      records: [],
      recordStartTime: null,
      recording: false
    };
    this.chunks = [];
  }
  componentDidMount() {
    if (navigator.mediaDevices.getUserMedia) {
      const onSuccess = stream => {
        const audioContext = new AudioContext();
        const mediaStreamSource = audioContext.createMediaStreamSource(stream);
        const meter = createAudioMeter(audioContext);
        mediaStreamSource.connect(meter);
        this.mediaRecorder = new MediaRecorder(stream);
        this.mediaRecorder.ondataavailable = e => {
          this.chunks.push(e.data);
        };
        let intervalWithoutSound = 0;
        setInterval(() => {
          if (this.state.recording) {
            if (meter.volume < VOLUME_LIMIT) {
              intervalWithoutSound += 100;
              if (intervalWithoutSound === INTERVAL_WITHOUT_SOUND) {
                if (
                  new Date().getTime() - this.state.recordStartTime.getTime() <
                  (INTERVAL_WITHOUT_SOUND + 1000)
                ) {
                  this.mediaRecorder.stop();
                  this.setState({ recording: false, recordStartTime: null });
                } else {
                  this.stop();
                }
                intervalWithoutSound = 0;
              }
            } else {
              intervalWithoutSound = 0;
            }
          } else if (meter.volume > VOLUME_LIMIT) {
            this.record();
          }
        }, 100);
      };
      const onError = err => {
      };
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(onSuccess, onError);
    } else {
    }
  }
  record() {
    this.setState({
      recording: true,
      recordStartTime: new Date()
    });
    this.chunks = [];
    this.mediaRecorder.start();
  }
  stop() {
    this.mediaRecorder.stop();
    const blob = new Blob(this.chunks, { type: "audio/wav" });
    const records = this.state.records;
    const url = window.URL.createObjectURL(blob);
    records.unshift({
      id: uniqueId(),
      date: new Date(),
      url,
      recordStartTime: this.state.recordStartTime,
      recordEndTime: new Date()
    });
    this.setState({
      records,
      recording: false,
      recordStartTime: null
    });
  }
  getDuration(start, end) {
    return humanizeDuration(end - start, { round: true });
  }
  formatTime(date) {
    return dayjs(date).format("HH:mm:ss");
  }
  togglePlayback(ref) {
    const element = this.refs[ref];
    if (!element.paused) {
      element.pause();
    } else {
      element.play();
    }
  }
  render() {
    return (
      <div className="App">
        <div className="container">
          <div id="bars">
            <div className={`bar ${this.state.recording && 'bg-red'}`} />
            <div className={`bar ${this.state.recording && 'bg-red'}`} />
            <div className={`bar ${this.state.recording && 'bg-red'}`} />
            <div className={`bar ${this.state.recording && 'bg-red'}`} />
            <div className={`bar ${this.state.recording && 'bg-red'}`} />
            <div className={`bar ${this.state.recording && 'bg-red'}`} />
            <div className={`bar ${this.state.recording && 'bg-red'}`} />
            <div className={`bar ${this.state.recording && 'bg-red'}`} />
            <div className={`bar ${this.state.recording && 'bg-red'}`} />
            <div className={`bar ${this.state.recording && 'bg-red'}`} />
          </div>
          <div>
            {this.state.records.map(record => {
              return (
                <div className="record clickable" key={record.id} onClick={() => this.togglePlayback(record.id)}>
                  <span className="float-left record-info"><span>{this.formatTime(record.date)}</span></span>
                  <span className="float-right record-info"><span>{this.getDuration(record.recordStartTime, record.recordEndTime)}</span></span>
                  <audio controls ref={record.id} id={record.id} src={record.url} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
}

export default App;
