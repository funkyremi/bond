import React, { Component } from "react";
import uniqueId from "lodash/uniqueId";
import humanizeDuration from "humanize-duration";
import dayjs from "dayjs";
import "bootstrap/dist/css/bootstrap.css";
import { AudioContext } from 'standardized-audio-context';
import volumemeter from 'volume-meter'
import "./App.css";
window.MediaRecorder = require("audio-recorder-polyfill");

const VOLUME_LIMIT = 5;
const INTERVAL_WITHOUT_SOUND = 3000;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      records: [],
      recordStartTime: null,
      recording: false
    };
  }
  componentDidMount() {
    if (navigator.mediaDevices.getUserMedia) {
      const onSuccess = stream => {
        // Volume meter
        const context = new AudioContext();
        const src = context.createMediaStreamSource(stream)
        let lastSoundTime = new Date().getTime();
        const meter = volumemeter(context, {}, (volume) => {
          if (this.state.recording) {
            if (volume < VOLUME_LIMIT) {
              if (new Date().getTime() - lastSoundTime >= INTERVAL_WITHOUT_SOUND) {
                this.stopRecording();
              }
            } else {
              lastSoundTime = new Date().getTime();
            }
          } else if (volume > VOLUME_LIMIT && !this.playbackInProgress()) {
            this.startRecording();
          }
        });
        stream.onended = meter.stop.bind(meter)
        src.connect(meter)

        // Recorder
        this.mediaRecorder = new MediaRecorder(stream);
        this.mediaRecorder.addEventListener("dataavailable", e => {
          this.mediaRecorder.stream.getTracks().forEach(i => i.stop());
          if ((new Date().getTime() - this.state.recordStartTime.getTime()) > (INTERVAL_WITHOUT_SOUND + 1000)) {
            // Save the record if the duration is > 1s
            const records = this.state.records;
            const url = window.URL.createObjectURL(e.data);
            records.unshift({
              id: uniqueId(),
              date: this.state.recordStartTime,
              url,
              paused: true,
              recordStartTime: this.state.recordStartTime,
              recordEndTime: new Date()
            });
            this.setState({
              records,
              recording: false,
              recordStartTime: null
            });
          } else {
            // Don't save the record if < 1s
            this.setState({
              recording: false,
              recordStartTime: null
            });
          }
        });
      };
      const onError = err => {
        console.error(err);
      };
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(onSuccess, onError);
    } else {
      console.error("Browser doesn't allow audio recording");
    }
  }
  startRecording() {
    this.setState({
      recording: true,
      recordStartTime: new Date()
    });
    this.mediaRecorder.start();
  }
  stopRecording() {
    this.mediaRecorder.stop();
  }
  playbackInProgress() {
    return this.state.records.find(record => !record.paused);
  }
  toggleRecord() {
    if (this.state.recording === true) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }
  getDuration(start, end) {
    return humanizeDuration(end - start, { round: true });
  }
  formatTime(date) {
    return dayjs(date).format("DD/MM/YYYY HH:mm:ss");
  }
  removeRecord(id) {
    const records = this.state.records;
    const recordIndex = records.findIndex(record => record.id === id);
    if (recordIndex > -1) {
      records.splice(recordIndex, 1);
      this.setState({ records });
    }
  }
  togglePlayback(ref) {
    const element = this.refs[ref];
    if (!element.paused) {
      element.pause();
      element.currentTime = 0;
    } else {
      element.play();
    }
  }
  handlePlay(id) {
    const records = this.state.records;
    const recordIndex = records.findIndex(record => record.id === id);
    if (recordIndex > -1) {
      records[recordIndex].paused = false;
      this.setState({ records });
    }
  }
  handlePause(id) {
    const records = this.state.records;
    const recordIndex = records.findIndex(record => record.id === id);
    if (recordIndex > -1) {
      records[recordIndex].paused = true;
      this.setState({ records });
    }
  }
  render() {
    return (
      <div className="App">
        <div className="container">
          <div id="bars">
            <div className={`bar ${this.state.recording && "bg-red"}`} />
            <div className={`bar ${this.state.recording && "bg-red"}`} />
            <div className={`bar ${this.state.recording && "bg-red"}`} />
            <div className={`bar ${this.state.recording && "bg-red"}`} />
            <div className={`bar ${this.state.recording && "bg-red"}`} />
            <div className={`bar ${this.state.recording && "bg-red"}`} />
            <div className={`bar ${this.state.recording && "bg-red"}`} />
            <div className={`bar ${this.state.recording && "bg-red"}`} />
            <div className={`bar ${this.state.recording && "bg-red"}`} />
            <div className={`bar ${this.state.recording && "bg-red"}`} />
          </div>
          <div>
            {this.state.records.map(record => {
              return (
                <div className="record" key={record.id}>
                  {record.paused ? (
                    <i
                      className="fas fa-2x fa-play-circle clickable float-left playback-button"
                      title="Play"
                      onClick={() => this.togglePlayback(record.id)}
                    />
                  ) : (
                    <i
                      className="fas fa-2x fa-pause-circle clickable float-left playback-button"
                      title="Pause"
                      onClick={() => this.togglePlayback(record.id)}
                    />
                  )}
                  <span className="text-center">
                    {this.formatTime(record.date)} (
                    {this.getDuration(
                      record.recordStartTime,
                      record.recordEndTime
                    )}
                    )
                  </span>
                  <span title="Remove record" className="float-right clickable margin-left-sm" onClick={() => this.removeRecord(record.id)}>
                    <i className="fas fa-lg fa-trash-alt" />
                  </span>
                  <span title="Download record" className="float-right">
                    <a
                      href={record.url}
                      className="text-black"
                      download={`record ${this.formatTime(record.date)}.wav`}
                    >
                      <i className="fas fa-lg fa-download" />
                    </a>
                  </span>
                  <audio
                    onPlay={() => this.handlePlay(record.id)}
                    onPause={() => this.handlePause(record.id)}
                    ref={record.id}
                    src={record.url}
                  />
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
