import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import '../style/index.css';

import {
  NotebookActions,
  INotebookTracker,
  INotebookModel
} from '@jupyterlab/notebook';

import { ICommandPalette } from '@jupyterlab/apputils';

// import { ContentsManager, Contents } from "@jupyterlab/services";

import { IFileBrowserFactory } from '@jupyterlab/filebrowser';

import { IDocumentManager } from '@jupyterlab/docmanager';

import { ServerConnection } from '@jupyterlab/services';

import { URLExt } from '@jupyterlab/coreutils';

import { Dialog, showDialog } from '@jupyterlab/apputils';

import { Widget } from '@lumino/widgets';

import RecordRTC from 'recordrtc';

class AudioRecorder extends Widget {
  constructor() {
    super({ node: Private.createAudioRecorderNode() });
  }
}

let audioRecorder: any;
const mimeType = 'audio/webm';
let saveFile: Function;
const insertCodeSnippet = false;
let insertCodeSnippetForFile: Function;
let audioStream: any;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Initialization data for the jupyterlab_media_capture extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_media_capture',
  autoStart: true,
  requires: [
    INotebookTracker,
    ICommandPalette,
    IFileBrowserFactory,
    IDocumentManager
  ],
  activate: (
    app: JupyterFrontEnd,
    tracker: INotebookTracker,
    palette: ICommandPalette,
    browserFactory: IFileBrowserFactory,
    docManager: IDocumentManager
  ) => {
    const { commands } = app;
    const command = 'media:record-audio';

    // let contents = new ContentsManager();
    // console.log(RecordRTC);

    saveFile = function (
      filename: string,
      content: any,
      mimeType: string,
      path: string
    ): Promise<string> {
      return new Promise((resolve, reject) => {
        path = `${
          path || browserFactory.defaultBrowser.model.path
        }/${filename}`;
        const settings = ServerConnection.makeSettings();
        const url = URLExt.join(
          settings.baseUrl,
          '/jupyterlab_media_capture/media_capture'
        );
        ServerConnection.makeRequest(
          url,
          { method: 'POST', body: JSON.stringify({ filename, path, content }) },
          settings
        )
          .then((response: any) => {
            return response.json();
          })
          .then((parsed_response: any) => {
            resolve(parsed_response.saved_path);
          });
      });
    };

    insertCodeSnippetForFile = async function (path: string) {
      let notebook: any;
      if (tracker.currentWidget === null) {
        // not in a notebook -- just open the file
        await commands
          .execute('notebook:create-new', {
            path,
            type: 'notebook',
            kernelName: 'conda-env-python-py'
          })
          .then(async (model: INotebookModel) => {
            notebook = model;
          });
      } else {
        notebook = tracker.currentWidget;
      }
      await notebook.context.ready;
      NotebookActions.insertBelow(notebook.content);
      let cellValue;
      if (notebook.content.activeCell) {
        cellValue = notebook.content.activeCell.model.value;
      } else {
        while (!notebook.model.cells.get(0)) {
          await sleep(500);
        }
        cellValue = notebook.model.cells.get(0).value;
      }

      cellValue.text = `from IPython.display import Audio
Audio("${path}")`;

      NotebookActions.run(notebook.content, notebook.session)
        .then((result: any) => {
          // do nothing
        })
        .catch((err: any) => {
          console.error(err);
        });
    };

    app.commands.addCommand(command, {
      label: 'Record Audio',
      execute: () => {
        showDialog({
          body: new AudioRecorder(),
          buttons: [Dialog.cancelButton({ label: 'Exit' })]
        }).then(result => {
          if (audioRecorder) {
            audioStream.getAudioTracks().forEach((track: any) => track.stop());
            audioRecorder.destroy;
          } else {
            console.error('no AudioRecorder');
          }
        });
      }
    });

    palette.addItem({ command, category: 'Media Capture' });
    console.log('JupyterLab extension jupyterlab_media_capture is activated!');
  }
};

namespace Private {
  export function createAudioRecorderNode(): HTMLElement {
    const body = document.createElement('div');

    const clearAudioRecorderNode = () => {
      let child;
      while ((child = body.firstChild)) {
        body.removeChild(child);
      }
    };

    const stopRecording = () => {
      // console.log(audioRecorder)
      audioRecorder.stopRecording(() => {
        const fileReader = new FileReader();
        const blob = audioRecorder.getBlob();

        const file_extension = blob.type.split('/')[1].split(';')[0];

        fileReader.readAsArrayBuffer(blob);
        fileReader.onload = () => {
          const content: any = Array.from(
            new Uint8Array(fileReader.result as any)
          );
          saveFile(
            `${Date.now()}.${file_extension}`,
            content,
            mimeType,
            null
          ).then((filepath: string) => {
            audioStream.getAudioTracks().forEach((track: any) => track.stop());
            audioRecorder.destroy();
            showDoneRecording(filepath);
          });
        };
        // RecordRTC.audioStream.getTracks().forEach((track: any) => {track.stop()})
        // RecordRTC.getTracks().forEach((track: any) => {track.stop()})
      });
    };

    const showDoneRecording = (filepath: string) => {
      clearAudioRecorderNode();
      const text = document.createElement('span');
      text.innerHTML = `<span>Saved recording as:</br></br>${filepath}</span></br>`;
      body.appendChild(text);

      // maybe later:
      if (insertCodeSnippet) {
        text.innerHTML = `<h3>Saved recording as ${filepath}</br>and inserted into your notebook.</h3></br>`;
        insertCodeSnippetForFile(filepath);
      }
    };

    const showRecording = () => {
      navigator.mediaDevices
        .getUserMedia({
          audio: true
        })
        .then(async stream => {
          clearAudioRecorderNode();
          audioStream = stream;

          audioRecorder = RecordRTC(audioStream, {
            type: 'audio',
            mimeType
          });
          const text = document.createElement('span');
          text.innerHTML = '<h3>Recording</h3></br>';
          text.className = 'blinking';
          body.appendChild(text);
          const stopRecordingButton = document.createElement('button');
          stopRecordingButton.className =
            'jp-Button stop-recording-icon jp-mod-styled';
          stopRecordingButton.onclick = stopRecording;
          body.appendChild(stopRecordingButton);

          audioRecorder.startRecording();
        });
    };

    const recordClickHandler = () => {
      showRecording();
    };

    const showRecordPrompt = () => {
      clearAudioRecorderNode();
      const text = document.createElement('span');
      text.innerHTML =
        '<h3>Click the button below to start recording</h3></br>';
      body.appendChild(text);
      const recordButton = document.createElement('button');

      recordButton.className = 'jp-Button microphone-icon jp-mod-styled';
      recordButton.onclick = recordClickHandler;
      body.appendChild(recordButton);
    };

    showRecordPrompt();
    return body;
  }
}

export default extension;
