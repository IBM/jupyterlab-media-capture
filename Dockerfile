FROM python


RUN pip install jupyterlab~=3.0

COPY dist/jupyterlab_media_capture-0.3.0-py3-none-any.whl .
RUN pip install jupyterlab_media_capture-0.3.0-py3-none-any.whl

RUN jupyter serverextension enable --py jupyterlab_media_capture
