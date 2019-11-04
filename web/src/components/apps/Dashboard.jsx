import moment from "moment";
import React, { Component } from "react";
import Helmet from "react-helmet";
import { withRouter } from "react-router-dom";
import { graphql, compose, withApollo } from "react-apollo";
import Loader from "../shared/Loader";
import DashboardCard from "./DashboardCard";
import ConfigureGraphsModal from "../shared/modals/ConfigureGraphsModal";

import { getAppLicense, getKotsAppDashboard } from "@src/queries/AppsQueries";
import { checkForKotsUpdates, setPrometheusAddress } from "@src/mutations/AppsMutations";

import { XYPlot, XAxis, YAxis, HorizontalGridLines, VerticalGridLines, LineSeries, DiscreteColorLegend, Crosshair } from "react-vis";

import { getValueFormat } from "@grafana/ui"
import Handlebars from "handlebars";

import "../../scss/components/watches/Dashboard.scss";
import "../../../node_modules/react-vis/dist/style";

class Dashboard extends Component {

  state = {
    appName: "",
    iconUri: "",
    currentVersion: {},
    downstreams: [],
    links: [],
    checkingForUpdates: false,
    checkingUpdateText: "Checking for updates",
    errorCheckingUpdate: false,
    appLicense: null,
    showConfigureGraphs: false,
    promValue: "",
    savingPromValue: false,
    activeChart: null,
    crosshairValues: []
  }

  toggleConfigureGraphs = () => {
    const { showConfigureGraphs } = this.state;
    this.setState({
      showConfigureGraphs: !showConfigureGraphs
    });
  }

  updatePromValue = () => {
    this.setState({ savingPromValue: true });
    this.props.client.mutate({
      mutation: setPrometheusAddress,
      variables: {
        value: this.state.promValue,
      },
    })
      .then(() => {
        this.setState({ savingPromValue: false });
        this.props.getKotsAppDashboard.refetch();
      })
      .catch(() => {
        this.setState({ savingPromValue: false });
      })
  }

  onPromValueChange = (e) => {
    const { value } = e.target;
    this.setState({
      promValue: value
    });
  }

  setWatchState = (app) => {
    this.setState({
      appName: app.name,
      iconUri: app.iconUri,
      currentVersion: app.downstreams[0]?.currentVersion,
      downstreams: app.downstreams[0],
      links: app.downstreams[0]?.links
    });
  }

  componentDidUpdate(lastProps) {
    const { app } = this.props;

    if (app !== lastProps.app && app) {
      this.setWatchState(app)
    }

    if (this.props.getAppLicense !== lastProps.getAppLicense && this.props.getAppLicense) {
      const { getAppLicense } = this.props.getAppLicense;
      if (getAppLicense) {
        this.setState({ appLicense: getAppLicense });
      }
    }
  }

  componentDidMount() {
    const { app } = this.props;
    const { getAppLicense } = this.props.getAppLicense;

    if (app) {
      this.setWatchState(app);
    }
    if (getAppLicense) {
      this.setState({ appLicense: getAppLicense });
    }
    this.props.getKotsAppDashboard.startPolling(2000);
  }

  onCheckForUpdates = async () => {
    const { client, app } = this.props;

    this.setState({ checkingForUpdates: true });

    this.loadingTextTimer = setTimeout(() => {
      this.setState({ checkingUpdateText: "Almost there, hold tight..." });
    }, 10000);

    await client.mutate({
      mutation: checkForKotsUpdates,
      variables: {
        appId: app.id,
      }
    }).catch(() => {
      this.setState({ errorCheckingUpdate: true });
    }).finally(() => {
      clearTimeout(this.loadingTextTimer);
      this.setState({
        checkingForUpdates: false,
        checkingUpdateText: "Checking for updates"
      });
      if (this.props.updateCallback) {
        this.props.updateCallback();
      }
    });
  }

  redirectToDiff = (currentSequence, pendingSequence) => {
    this.props.history.push(`${this.props.match.params.slug}/version-history/diff/${currentSequence}/${pendingSequence}`)
  }

  onUploadNewVersion = () => {
    this.props.history.push(`/${this.props.match.params.slug}/airgap`);
  }

  getLegendItems = (chart) => {
    return chart.series.map((series) => {
      const metrics = {};
      series.metric.forEach((metric) => {
        metrics[metric.name] = metric.value;
      });
      if (series.legendTemplate) {
        try {
          const template = Handlebars.compile(series.legendTemplate);
          return template(metrics);
        } catch (err) {
          console.error("Failed to compile legend template", err);
        }
      }
      return metrics.length > 0 ? metrics[Object.keys(metrics)[0]] : "";
    });
  }

  getValue = (chart, value) => {
    let yAxisTickFormat = null;
    if (chart.tickFormat) {
      const valueFormatter = getValueFormat(chart.tickFormat);
      yAxisTickFormat = (v) => `${valueFormatter(v)}`;
      return yAxisTickFormat(value);
    } else if (chart.tickTemplate) {
      try {
        const template = Handlebars.compile(chart.tickTemplate);
        yAxisTickFormat = (v) => `${template({ values: v })}`;
        return yAxisTickFormat(value);
      } catch (err) {
        console.error("Failed to compile y axis tick template", err);
      }
    } else {
      return value.toFixed(5);
    }
  }

  renderGraph = (chart) => {
    const axisStyle = {
      title: { fontSize: "12px", fontWeight: 500, fill: "#4A4A4A" },
      ticks: { fontSize: "12px", fontWeight: 400, fill: "#4A4A4A" }
    }
    const legendItems = this.getLegendItems(chart);
    const series = chart.series.map((series, idx) => {
      const data = series.data.map((valuePair) => {
        return { x: valuePair.timestamp, y: valuePair.value };
      });

      return (
        <LineSeries
          key={idx}
          data={data}
          onNearestX={(value, { index }) => this.setState({
            crosshairValues: chart.series.map(s => ({ x: moment.unix((s.data[index].timestamp)).format("LLL"), y: this.getValue(chart, s.data[index].value), pod: s.metric[0].value })),
            activeChart: chart
          })}
        />
      );
    });

    let yAxisTickFormat = null;
    if (chart.tickFormat) {
      const valueFormatter = getValueFormat(chart.tickFormat);
      yAxisTickFormat = (v) => `${valueFormatter(v)}`;
    } else if (chart.tickTemplate) {
      try {
        const template = Handlebars.compile(chart.tickTemplate);
        yAxisTickFormat = (v) => `${template({ values: v })}`;
      } catch (err) {
        console.error("Failed to compile y axis tick template", err);
      }
    }

    return (
      <div className="dashboard-card graph flex-column flex1 flex u-marginTop--20" key={chart.title}>
        <XYPlot width={460} height={180} onMouseLeave={() => this.setState({ crosshairValues: []})}>
          <VerticalGridLines />
          <HorizontalGridLines />
          <XAxis tickFormat={v => `${moment.unix(v).format("H:mm")}`} style={axisStyle} />
          <YAxis width={60} tickFormat={yAxisTickFormat} style={axisStyle} />
          {series}
          {this.state.crosshairValues?.length > 0 && this.state.activeChart === chart &&
            <Crosshair values={this.state.crosshairValues}>
              <div className="flex flex-column" style={{ background: "black", width:"250px" }}>
                  <p className="u-fontWeight--bold u-textAlign--center"> {this.state.crosshairValues[0].x} </p>
                <br/>
                {this.state.crosshairValues.map((c ,i)=> {
                  return (
                    <div className="flex-auto flex flexWrap--wrap u-padding--5" key={i}>
                      <div className="flex flex1">
                        <p className="u-fontWeight--normal">{c.pod}:</p>
                      </div>
                      <div className="flex flex1">
                        <span className="u-fontWeight--bold u-marginLeft--10">{c.y}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Crosshair>
          }
        </XYPlot>
        {legendItems ? <DiscreteColorLegend className="legends" height={120} items={legendItems} /> : null}
        <div className="u-marginTop--10 u-paddingBottom--10 u-textAlign--center">
          <p className="u-fontSize--normal u-fontWeight--bold u-color--tundora u-lineHeight--normal">{chart.title}</p>
        </div>
      </div>
    );
  }


  render() {
    const {
      appName,
      iconUri,
      currentVersion,
      downstreams,
      links,
      checkingForUpdates,
      checkingUpdateText,
      errorCheckingUpdate,
      appLicense,
      showConfigureGraphs,
      promValue,
      savingPromValue
    } = this.state;

    const { app } = this.props;

    const isAirgap = app.isAirgap;
    const latestPendingVersion = downstreams?.pendingVersions?.find(version => Math.max(version.sequence));

    if (!app || !appLicense) {
      return (
        <div className="flex-column flex1 alignItems--center justifyContent--center">
          <Loader size="60" />
        </div>
      );
    }


    return (
      <div className="flex-column flex1 u-position--relative u-overflow--auto u-padding--20">
        <Helmet>
          <title>{appName}</title>
        </Helmet>
        <div className="Dashboard flex flex-auto justifyContent--center alignSelf--center alignItems--center">
          <div className="flex1 flex-column">
            <div className="flex flex1">
              <div className="flex flex1 alignItems--center">
                <div className="flex flex-auto">
                  <div
                    style={{ backgroundImage: `url(${iconUri})` }}
                    className="Dashboard--appIcon u-position--relative">
                  </div>
                </div>
                <p className="u-fontSize--30 u-color--tuna u-fontWeight--bold u-marginLeft--20">{appName}</p>
              </div>
            </div>
            <div className="u-marginTop--30 u-paddingTop--10 flex-auto flex flexWrap--wrap u-width--full alignItems--center justifyContent--center">
              <DashboardCard
                cardName="Application"
                application={true}
                cardIcon="applicationIcon"
                appStatus={this.props.getKotsAppDashboard.getKotsAppDashboard?.appStatus?.state}
                url={this.props.match.url}
                links={links}
                app={app}
              />
              <DashboardCard
                cardName={`Version: ${currentVersion?.title ? currentVersion?.title : ""}`}
                cardIcon="versionIcon"
                versionHistory={true}
                currentVersion={currentVersion}
                downstreams={downstreams}
                isAirgap={isAirgap}
                app={app}
                url={this.props.match.url}
                checkingForUpdates={checkingForUpdates}
                checkingUpdateText={checkingUpdateText}
                errorCheckingUpdate={errorCheckingUpdate}
                onCheckForUpdates={() => this.onCheckForUpdates()}
                onUploadNewVersion={() => this.onUploadNewVersion()}
                redirectToDiff={() => this.redirectToDiff(currentVersion?.sequence, latestPendingVersion.sequence)}
              />
              <DashboardCard
                cardName="License"
                cardIcon="licenseIcon"
                license={true}
                url={this.props.match.url}
                appLicense={appLicense}
              />
            </div>
            <div className="u-marginTop--30 flex flex1">
              {this.props.getKotsAppDashboard?.getKotsAppDashboard?.prometheusAddress ?
                <div>
                  <div className="flex flex1 justifyContent--flexEnd"> 
                    <span className="card-link" onClick={this.toggleConfigureGraphs}> Configure Prometheus Address </span>
                  </div>
                  <div className="flex-auto flex flexWrap--wrap u-width--full">
                    {this.props.getKotsAppDashboard.getKotsAppDashboard.metrics.map(this.renderGraph)}
                  </div>
                </div>
                :
                <div className="flex-auto flex flexWrap--wrap u-width--full u-position--relative">
                  <div className="dashboard-card emptyGraph flex-column flex1 flex">
                    <div className="flex flex1 justifyContent--center alignItems--center alignSelf--center">
                      <span className="icon graphIcon"></span>
                    </div>
                  </div>
                  <div className="dashboard-card emptyGraph flex-column flex1 flex">
                    <div className="flex flex1 justifyContent--center alignItems--center alignSelf--center">
                      <span className="icon graphPieIcon"></span>
                    </div>
                  </div>
                  <div className="dashboard-card absolute-button  flex flex1 alignItems--center justifyContent--center alignSelf--center">
                    <button className="btn secondary lightBlue" onClick={this.toggleConfigureGraphs}> Configure graphs </button>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
        <ConfigureGraphsModal
          showConfigureGraphs={showConfigureGraphs}
          toggleConfigureGraphs={this.toggleConfigureGraphs}
          updatePromValue={this.updatePromValue}
          promValue={promValue}
          savingPromValue={savingPromValue}
          onPromValueChange={this.onPromValueChange}
        />
      </div>
    );
  }
}

export default compose(
  withApollo,
  withRouter,
  graphql(getAppLicense, {
    name: "getAppLicense",
    options: ({ app }) => {
      return {
        variables: {
          appId: app.id
        },
        fetchPolicy: "no-cache"
      };
    }
  }),
  graphql(getKotsAppDashboard, {
    name: "getKotsAppDashboard",
    options: ({ match, cluster }) => {
      return {
        variables: {
          slug: match.params.slug,
          clusterId: cluster?.id
        },
        fetchPolicy: "no-cache"
      };
    }
  }),
  graphql(setPrometheusAddress, {
    props: ({ mutate }) => ({
      setPrometheusAddress: (value) => mutate({ variables: { value } })
    })
  })
)(Dashboard);
