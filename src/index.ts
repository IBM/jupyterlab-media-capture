import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from "@jupyterlab/application";

import "../style/index.css";

import {
  NotebookActions,
  INotebookTracker,
  INotebookModel
} from "@jupyterlab/notebook";

import { ICommandPalette } from "@jupyterlab/apputils";

// import { ContentsManager, Contents } from "@jupyterlab/services";

import { IFileBrowserFactory } from "@jupyterlab/filebrowser";

import { IDocumentManager } from "@jupyterlab/docmanager";

import { ServerConnection } from "@jupyterlab/services";

import { URLExt } from "@jupyterlab/coreutils";

import { Dialog, showDialog } from "@jupyterlab/apputils";

import { Widget } from "@phosphor/widgets";

import * as RecordRTC from "recordrtc";

class AudioRecorder extends Widget {
  constructor() {
    super({ node: Private.createAudioRecorderNode() });
  }
}

let audioRecorder: any;
const mimeType = "audio/wav";
let saveFile: Function;
let insertCodeSnippet = false;
let insertCodeSnippetForFile: Function;
let audioStream: any;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Initialization data for the jupyterlab_media_capture extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: "jupyterlab_media_capture",
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
    const command: string = "media:record-audio";

    // let contents = new ContentsManager();
    // console.log(RecordRTC);

    saveFile = function(
      filename: string,
      content: any,
      mimeType: string,
      path: string
    ): Promise<string> {
      return new Promise((resolve, reject) => {
        path = `${path ||
          browserFactory.defaultBrowser.model.path}/${filename}`;
        const settings = ServerConnection.makeSettings();
        const url = URLExt.join(settings.baseUrl, "/media_capture");
        ServerConnection.makeRequest(
          url,
          { method: "POST", body: JSON.stringify({ filename, path, content }) },
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

    insertCodeSnippetForFile = async function(path: string) {
      let notebook: any;
      if (tracker.currentWidget == null) {
        // not in a notebook -- just open the file
        await commands
          .execute("notebook:create-new", {
            path,
            type: "notebook",
            kernelName: "conda-env-python-py"
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
        .then((result: any) => {})
        .catch((err: any) => {
          console.error(err);
        });
    };

    app.commands.addCommand(command, {
      label: "Record Audio",
      execute: () => {
        showDialog({
          body: new AudioRecorder(),
          buttons: [Dialog.cancelButton({ label: "Exit" })]
        }).then(result => {
          if (audioRecorder) {
            audioStream.getAudioTracks().forEach((track: any) => track.stop());
            audioRecorder.destroy;
          }
        });

        if (1 > 2) {
        }

        //         var video = document.createElement("video");
        //         video.id = "video";
        //         video.autoplay = true;
        //         video.hidden = true;

        //         var canvas = document.createElement("canvas");
        //         canvas.height = 1200;
        //         canvas.width = 1600;
        //         canvas.hidden = true;

        //         const context = canvas.getContext("2d");

        //         const constraints = {
        //           video: true
        //         };

        //         document.body.appendChild(video);

        //         navigator.mediaDevices
        //           .getUserMedia(constraints)
        //           .then(stream => {
        //             video.srcObject = stream;
        //             video.play;
        //             return new Promise(resolve => (video.onplaying = resolve));
        //           })
        //           .then(() => {
        //             setTimeout(() => {
        //               // wait for camera to adjust
        //               context.drawImage(video, 0, 0, canvas.width, canvas.height);
        //               var image = canvas.toDataURL();
        //               console.log(image);

        //               // let future = tracker.currentWidget.session.kernel.requestExecute({
        //               //   code: `image = ${image}`
        //               // });
        //               // future.done.then(() => {console.log('image available')});
        //               let name = `${Date.now()}.png`;
        //               let path = `${browserFactory.defaultBrowser.model.path}/${name}`;
        //               let model: Partial<Contents.IModel> = {
        //                 type: "file",
        //                 format: "base64",
        //                 content: image.split(",")[1],
        //                 path,
        //                 name,
        //                 mimeType: "image/png"
        //               };

        //               contents
        //                 .save(path, model)
        //                 .then(model => {
        //                   if (tracker.currentWidget == null) {
        //                     // not in a notebook -- just open the image
        //                     docManager.open(path);
        //                   } else {
        //                     console.log("inserting cell");
        //                     NotebookActions.insertBelow(tracker.currentWidget.content);
        //                     tracker.currentWidget.content.activeCell.model.value.text = `from matplotlib import pyplot as plt
        // import cv2

        // img = cv2.imread(".${path}")
        // img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB) # fix color
        // plt.axis("off") # remove axes ticks
        // plt.imshow(img)
        // plt.show()`;
        //                     NotebookActions.run(
        //                       tracker.currentWidget.content,
        //                       tracker.currentWidget.session
        //                     )
        //                       .then(result => {
        //                         console.log(result);
        //                       })
        //                       .catch(err => {
        //                         console.error(err);
        //                       });
        //                   }
        //                 })
        //                 .catch(err => {
        //                   console.error("unable to save webcam image");
        //                   console.error(err);
        //                 });

        //               (<MediaStream>video.srcObject)
        //                 .getVideoTracks()
        //                 .forEach(track => track.stop());
        //               video.remove();
        //               canvas.remove();
        //             }, 1000);
        //           })
        //           .catch(err => {
        //             console.error(err);
        //           });
      }
    });

    palette.addItem({ command, category: "Media Capture" });
    console.log("JupyterLab extension jupyterlab_media_capture is activated!");
  }
};

namespace Private {
  export function createAudioRecorderNode(): HTMLElement {
    let body = document.createElement("div");

    var clearAudioRecorderNode = () => {
      let child;
      while ((child = body.firstChild)) {
        body.removeChild(child);
      }
    };

    var stopRecording = () => {
      audioRecorder.stopRecording(function() {
        var fileReader = new FileReader();
        const blob = audioRecorder.getBlob();

        fileReader.readAsArrayBuffer(blob);
        fileReader.onload = () => {
          var content: any = Array.from(
            new Uint8Array(fileReader.result as any)
          );
          saveFile(`${Date.now()}.ogg`, content, mimeType, null).then(
            (filepath: string) => {
              audioStream
                .getAudioTracks()
                .forEach((track: any) => track.stop());
              audioRecorder.destroy();
              showDoneRecording(filepath);
            }
          );
        };
        // RecordRTC.audioStream.getTracks().forEach((track: any) => {track.stop()})
        // RecordRTC.getTracks().forEach((track: any) => {track.stop()})
      });
    };

    var showDoneRecording = (filepath: string) => {
      clearAudioRecorderNode();
      let text = document.createElement("span");
      text.innerHTML = `<h3>Saved recording as ${filepath}</h3></br>`;
      body.appendChild(text);
      // maybe later:
      if (insertCodeSnippet) {
        text.innerHTML = `<h3>Saved recording as ${filepath}</br>and inserted into your notebook.</h3></br>`;
        insertCodeSnippetForFile(filepath);
      }
    };

    var showRecording = () => {
      navigator.mediaDevices
        .getUserMedia({
          audio: true
        })
        .then(async function(stream) {
          clearAudioRecorderNode();
          audioStream = stream;
          audioRecorder = RecordRTC(audioStream, {
            type: "audio",
            mimeType
          });
          /// put button here
          let text = document.createElement("span");
          text.innerHTML = "<h3>Recording</h3></br>";
          text.className = "blinking";
          body.appendChild(text);
          let stopRecordingButton = document.createElement("span");
          stopRecordingButton.className = "stop-recording-icon";
          stopRecordingButton.onclick = stopRecording;
          body.appendChild(stopRecordingButton);

          audioRecorder.startRecording();
        });
    };

    var recordClickHandler = () => {
      showRecording();
    };

    var showRecordPrompt = () => {
      clearAudioRecorderNode();
      let text = document.createElement("span");
      text.innerHTML = "<h3>Click the button to start recording</h3></br>";
      body.appendChild(text);
      let recordButton = document.createElement("span");
      recordButton.className = "microphone-icon";
      recordButton.onclick = recordClickHandler;
      body.appendChild(recordButton);
    };

    showRecordPrompt();
    return body;
  }
}

export default extension;
