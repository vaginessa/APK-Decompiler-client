import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import RaisedButton from 'material-ui/RaisedButton';
import axios from 'axios';
import CircularProgress from 'material-ui/CircularProgress';
import LinearProgress from 'material-ui/LinearProgress';
import FileTree from './FileTree';
import 'react-nested-file-tree/dist/default.css';
import '../../public/css/AddApp.css';

class AddApp extends Component {
  constructor (props) {
    super(props);
    this.state = {
      isSignedUp: false,
      uploadedFileCloudinaryUrl: '',
      _tutorialLink: null,
      _tutorialTitle: null,
      _tutorialType: null,
      isPosting: false,
      isPosted: false,
      directory: null,
      redirectToRefferer: false,
      fileData: null,
      isDecompiling: false,
      err: null,
      isErr: false,
      mess: null,
      completed: 0
    };

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.progress = this.progress.bind(this);
  }

  handleOpen () {
    this.setState({open: true});
  }

  handleClose () {
    this.setState({open: false});
  }

  progress(completed) {
    if (completed > 90) {
      this.setState({completed: 90});
    } else {
      this.setState({completed});
      const diff = Math.random() * 10;
      this.timer = setTimeout(() => this.progress(completed + diff), 1000);
    }
  }

  saveApkFile (file, userId) {
    axios.post(`http://138.197.29.193:3002/users/app/save-apk?file=${file.name}&userId=${userId}`)
    .then(res => {
      console.log();
    })
    .catch(err => console.error(err));
  }

  getDecompiled = (file, userId) => {
    var evtSource = new EventSource(`http://138.197.29.193:3002/users/app/upload-file/` +
      `?originalname=${file}&userId=${userId}`);
    evtSource.onmessage = function(e) {
      let message = JSON.parse(e.data);
      if (message.msg === 'end') {
        this.setState({completed: 100})
        evtSource.close();
        this.getTree(file, userId);
      }
      this.setState({
        mess: message.msg
      })
    }.bind(this);
  }

  getTree = (file, userId) => {
    axios.get(`http://138.197.29.193:3002/users/app/view?file=${file}&userId=${userId}`)
      .then(res =>  {
        this.setState({directory: res.data, isDecompiling: false})
        this.saveApkFile(file, userId);
      })
      .catch(err => console.log(err))
    ;
  }

  handleSubmit (e) {
    e.preventDefault();
    const userId = this.props.posts.user[0]._id;
    let data = new FormData();
    const fileData = document.querySelector("input[type='file']").files[0];
    data.append('file', fileData);
    data.append('userId', userId);
    if (fileData) {
      this.timer = setTimeout(() => this.progress(2), 1000);
      this.setState({ isPosting: true, isDecompiling: true });
      axios.post('http://138.197.29.193:3002/users/app', data)
      .then(res => {
        this.getDecompiled(fileData.name, userId);
      })
      .catch(err => console.error(err));
    } else {
      this.setState({err: 'Please select a file to upload', isErr: true});
    }
  }

  render () {
    const { isPosting, isPosted, directory, isDecompiling, isErr, err, mess, completed } = this.state;
    const { isFetching } = this.props;
    const fileStructure = (isDecompiling) ? (
      <div className='fl-wd-80'>
        <h1>{Math.round(completed)} %</h1>
        <LinearProgress mode="determinate" value={completed} />
        <p>{mess}</p>
      </div>
    ) : (
      <div className='fl-wd-80'>
        <h3>Your directory structure shows here:</h3>
        <FileTree directory={directory} />
      </div>
    );

    const errorMessage = (isErr) ? (
      <h1>{err}</h1>
    ) : (
      {err}
    );

    const { from } = { from: { pathname: '/my-posts' } };
    if (isPosted) {
      return (
        <Redirect to={from} />
      );
    }

    if (isFetching) {
      return (
        <div className='flex sc-size'>
          <CircularProgress size={80} thickness={5} />
        </div>
      );
    }

    return (
      <div className='container flex'>
        <div className='tc sc-size fl-wd-50 upload-form'>
          <div className='col-md-6'>
            <div className='flex mt-50 text'>
              <h1>Upload a new apk file</h1>
            </div>
            <form onSubmit={this.handleSubmit}
              encType='multipart/form-data'
              method='post'
              className='fl-dir-col flex text'>
              <div className='form-group'>
                <input
                  type='file'
                  multiple={this.props.multi}
                  ref='file'
                  accept={this.props.accept}
                  className='btn btn-primary' />
              </div>
              <div className='form-group mt-20'>
                <RaisedButton type='submit' label='Add Apk' primary={true} />
              </div>
            </form>
          </div>
        </div>
        <div className='fl-wd-50 flex'>
          {fileStructure}
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  const { selectedSession, postsBySession } = state;
  const {
    isFetching,
    lastUpdated,
    items: posts
  } = postsBySession['undefined'] || {
    isFetching: true,
    items: []
  };

  return {
    selectedSession,
    posts,
    isFetching,
    lastUpdated
  };
};

export default connect(mapStateToProps)(AddApp);
